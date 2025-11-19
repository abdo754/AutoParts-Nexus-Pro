import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Product, User } from '../types';
import * as XLSX from 'xlsx'; // Import the xlsx library
import translateTexts from '../services/translationService'; // Import translation service
import { containsArabic } from '../utils/textUtils'; // Import new utility

interface SupplierDashboardProps {
  currentUser: User;
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'shopId' | 'shopName'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

interface NormalizedProductData {
  Category_Arabic: string;
  Category_English: string;
  ItemName_Arabic: string;
  ItemName_English: string;
  Info_Arabic: string;
  Info_English: string;
  CarCompany: string;
  CarModel: string;
  CarInfo: string;
  Brand: string;
  OEM_Number: string;
}

const SupplierDashboard: React.FC<SupplierDashboardProps> = ({
  currentUser,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const normalizeFileInputRef = useRef<HTMLInputElement>(null);


  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    partNumber: '',
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: '',
    make: '',
    model: '',
    year: '',
    vehicleType: '',
    quantityAvailable: '',
  });

  // States for standard upload feedback
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadFeedbackMessage, setUploadFeedbackMessage] = useState<string | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);

  // States for normalization feedback
  const [isNormalizing, setIsNormalizing] = useState<boolean>(false);
  const [normalizedOutputData, setNormalizedOutputData] = useState<NormalizedProductData[] | null>(null);
  const [normalizationFeedbackMessage, setNormalizationFeedbackMessage] = useState<string | null>(null);
  const [normalizationWarnings, setNormalizationWarnings] = useState<string[]>([]);
  const [normalizationError, setNormalizationError] = useState<string | null>(null);
  const [normalizeFile, setNormalizeFile] = useState<File | null>(null);


  // Populate edit form when editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      setEditForm({
        partNumber: editingProduct.partNumber,
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price.toString(),
        imageUrl: editingProduct.imageUrl,
        category: editingProduct.category,
        make: editingProduct.make,
        model: editingProduct.model,
        year: editingProduct.year.toString(),
        vehicleType: editingProduct.vehicleType,
        quantityAvailable: editingProduct.quantityAvailable.toString(),
      });
    } else {
      // Clear form when not editing
      setEditForm({ partNumber: '', name: '', description: '', price: '', imageUrl: '', category: '', make: '', model: '', year: '', vehicleType: '', quantityAvailable: '' });
    }
  }, [editingProduct]);

  const myProducts = useMemo(() => {
    return products.filter((p) => p.shopId === currentUser.id);
  }, [products, currentUser.id]);

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const parseExcelData = useCallback((rawData: any[][]) => {
    const productDetailsFromExcel: Omit<Product, 'id' | 'shopId' | 'shopName'>[] = [];
    const warnings: string[] = [];
    let successfulUploads = 0;

    if (!rawData || rawData.length < 2) { // Need at least header and one data row
      warnings.push('No valid data found in the Excel sheet. Ensure it has a header and product rows.');
      return { productDetails: [], warnings, successfulUploads: 0 };
    }

    const headerRow = rawData[0].map(h => typeof h === 'string' ? h.trim() : '');
    const expectedHeaders = [
      'Part Number', 'Part Name', 'Make', 'Model', 'Year', 'Price', 'Stock', 'Description'
    ];
    const headerMap: { [key: string]: string } = {
      'Part Number': 'partNumber',
      'Part Name': 'name',
      'Make': 'make',
      'Model': 'model',
      'Year': 'year',
      'Price': 'price',
      'Stock': 'quantityAvailable',
      'Description': 'description'
    };

    const headerIndices: { [key: string]: number } = {};
    let missingHeaderCount = 0;
    expectedHeaders.forEach(expectedH => {
      const index = headerRow.findIndex(h => h.toLowerCase() === expectedH.toLowerCase()); // Case-insensitive header match
      if (index === -1) {
        warnings.push(`Missing expected column: "${expectedH}".`);
        missingHeaderCount++;
      } else {
        headerIndices[headerMap[expectedH]] = index;
      }
    });

    if (missingHeaderCount > 0) {
      warnings.push(`The Excel file is missing ${missingHeaderCount} required header column(s). Please ensure all 8 columns (${expectedHeaders.join(', ')}) are present and correctly named.`);
      return { productDetails: [], warnings, successfulUploads: 0 };
    }

    for (let i = 1; i < rawData.length; i++) { // Start from second row to skip header
      const row = rawData[i];
      if (!row || row.filter(cell => cell !== undefined && cell !== null && String(cell).trim() !== '').length === 0) {
        // Skip entirely empty rows
        continue;
      }

      const product: any = {};
      let rowHasError = false;

      // Populate product data based on header mapping
      for (const productKey in headerIndices) {
        const colIndex = headerIndices[productKey];
        product[productKey] = row[colIndex];
      }

      // Type conversion and validation
      const partNumber = String(product.partNumber || '').trim();
      const name = String(product.name || '').trim();
      const make = String(product.make || '').trim();
      const model = String(product.model || '').trim();
      const year = parseInt(String(product.year));
      const price = parseFloat(String(product.price));
      const quantityAvailable = parseInt(String(product.quantityAvailable));
      const description = String(product.description || '').trim();


      if (!partNumber) {
        warnings.push(`Row ${i + 1}: Skipping product due to missing Part Number.`);
        rowHasError = true;
      }
      if (!name) {
        warnings.push(`Row ${i + 1}: Skipping product "${partNumber}" due to missing Part Name.`);
        rowHasError = true;
      }
      if (!make) {
        warnings.push(`Row ${i + 1}: Skipping product "${partNumber}" due to missing Make.`);
        rowHasError = true;
      }
      if (!model) {
        warnings.push(`Row ${i + 1}: Skipping product "${partNumber}" due to missing Model.`);
        rowHasError = true;
      }
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 5) { // Allow slightly future for new models
        warnings.push(`Row ${i + 1}: Skipping product "${partNumber}" due to invalid Year (${product.year}). Expected a number between 1900 and ${new Date().getFullYear() + 5}.`);
        rowHasError = true;
      }
      if (isNaN(price) || price <= 0) {
        warnings.push(`Row ${i + 1}: Skipping product "${partNumber}" due to invalid Price (${product.price}). Expected a positive number.`);
        rowHasError = true;
      }
      if (isNaN(quantityAvailable) || quantityAvailable < 0) {
        warnings.push(`Row ${i + 1}: Skipping product "${partNumber}" due to invalid Stock (Quantity) (${product.quantityAvailable}). Expected a non-negative integer.`);
        rowHasError = true;
      }

      if (rowHasError) {
        continue;
      }

      productDetailsFromExcel.push({
        partNumber,
        name,
        description,
        price,
        imageUrl: 'https://picsum.photos/300/200?random=' + Math.floor(Math.random() * 10000), // Default image
        category: 'General Auto Part', // Default category
        make,
        model,
        year,
        vehicleType: `${make} ${model} (${year})`.trim() || 'General', // Derived vehicle type
        quantityAvailable,
      });
      successfulUploads++;
    }

    return { productDetails: productDetailsFromExcel, warnings, successfulUploads };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xlsm')) {
        setSelectedFile(file);
        setUploadStatus('idle'); // Reset status on new file selection
        setUploadFeedbackMessage(null);
        setUploadWarnings([]);
      } else {
        setSelectedFile(null);
        setUploadStatus('error');
        setUploadFeedbackMessage('Invalid file type. Please upload an .xlsx or .xlsm file.');
        setUploadWarnings([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear the file input visually
        }
      }
    } else {
      setSelectedFile(null);
      setUploadStatus('idle');
      setUploadFeedbackMessage(null);
      setUploadWarnings([]);
    }
  };

  const handleUploadButtonClick = useCallback(() => {
    if (!selectedFile) {
      setUploadStatus('error');
      setUploadFeedbackMessage('Please select an Excel file (.xlsx or .xlsm) to upload.');
      return;
    }

    setUploadStatus('uploading');
    setUploadFeedbackMessage(null);
    setUploadWarnings([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // Get the first sheet name
        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Get data as array of arrays

        const { productDetails, warnings, successfulUploads } = parseExcelData(rawData);

        if (successfulUploads > 0) {
          productDetails.forEach(product => onAddProduct(product));
          setUploadStatus('success');
          setUploadFeedbackMessage(`${successfulUploads} products uploaded successfully!`);
          setUploadWarnings(warnings);
        } else if (warnings.length > 0) {
          setUploadStatus('error'); // All lines had warnings/errors
          setUploadFeedbackMessage('No products were uploaded. See warnings below.');
          setUploadWarnings(warnings);
        } else {
          setUploadStatus('error');
          setUploadFeedbackMessage('No valid product data found in the Excel file.');
        }

        setSelectedFile(null); // Clear selected file state
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear the file input visually
        }
      } catch (error) {
        console.error('Error processing Excel file:', error);
        setUploadStatus('error');
        setUploadFeedbackMessage(`Error reading or parsing Excel file: ${(error as Error).message}. Please ensure it's a valid .xlsx or .xlsm file and follows the specified format.`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setUploadStatus('error');
      setUploadFeedbackMessage('Error reading file. Please try again.');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(selectedFile); // Read as ArrayBuffer for Excel files
  }, [selectedFile, parseExcelData, onAddProduct]);


  const handleStartEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleUpdateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      const updatedProductData: Product = {
        ...editingProduct,
        partNumber: editForm.partNumber.trim(),
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: parseFloat(editForm.price),
        imageUrl: editForm.imageUrl.trim() || 'https://picsum.photos/300/200?random=' + Math.floor(Math.random() * 1000),
        category: editForm.category.trim() || 'Uncategorized',
        make: editForm.make.trim(),
        model: editForm.model.trim(),
        year: parseInt(editForm.year),
        vehicleType: editForm.vehicleType.trim() || `${editForm.make.trim()} ${editForm.model.trim()} ${editForm.year.trim()}`.trim() || 'General',
        quantityAvailable: parseInt(editForm.quantityAvailable),
      };

      if (isNaN(updatedProductData.price) || isNaN(updatedProductData.quantityAvailable) || isNaN(updatedProductData.year) || updatedProductData.price <= 0 || updatedProductData.quantityAvailable < 0) {
        alert('Please ensure Price, Year, and Quantity are valid numbers and positive values.');
        return;
      }
      onUpdateProduct(updatedProductData);
      setEditingProduct(null); // Exit edit mode
    }
  };

  // --- Normalization Functions ---
  const handleNormalizeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xlsm')) {
        setNormalizeFile(file);
        setNormalizedOutputData(null); // Clear previous results
        setNormalizationFeedbackMessage(null);
        setNormalizationWarnings([]);
        setNormalizationError(null);
      } else {
        setNormalizeFile(null);
        setNormalizationError('Invalid file type. Please upload an .xlsx or .xlsm file.');
        if (normalizeFileInputRef.current) {
          normalizeFileInputRef.current.value = '';
        }
      }
    } else {
      setNormalizeFile(null);
      setNormalizedOutputData(null);
      setNormalizationFeedbackMessage(null);
      setNormalizationWarnings([]);
      setNormalizationError(null);
    }
  };

  const handleNormalizeAndDownload = useCallback(async () => {
    if (!normalizeFile) {
      setNormalizationError('Please select an Excel file (.xlsx or .xlsm) to normalize.');
      return;
    }

    setIsNormalizing(true);
    setNormalizedOutputData(null);
    setNormalizationFeedbackMessage('Reading and processing Excel file...');
    setNormalizationWarnings([]);
    setNormalizationError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawData || rawData.length < 2) {
          setNormalizationError('No valid data found in the Excel sheet. Ensure it has a header and product rows.');
          setIsNormalizing(false);
          return;
        }

        const headerRow = rawData[0].map(h => typeof h === 'string' ? h.trim() : '');
        const expectedInputHeaders = [
          'Category', 'Item Name', 'Info', 'Car Company', 'Car Model', 'Car Info', 'Brand', 'OEM Number'
        ];
        const inputHeaderMap: { [key: string]: string } = {
          'Category': 'Category',
          'Item Name': 'ItemName',
          'Info': 'Info',
          'Car Company': 'CarCompany',
          'Car Model': 'CarModel',
          'Car Info': 'CarInfo',
          'Brand': 'Brand',
          'OEM Number': 'OEM_Number',
        };

        const headerIndices: { [key: string]: number } = {};
        let missingHeaderCount = 0;
        expectedInputHeaders.forEach(expectedH => {
          const index = headerRow.findIndex(h => h.toLowerCase() === expectedH.toLowerCase());
          if (index === -1) {
            setNormalizationWarnings(prev => [...prev, `Missing expected column: "${expectedH}".`]);
            missingHeaderCount++;
          } else {
            headerIndices[inputHeaderMap[expectedH]] = index;
          }
        });

        if (missingHeaderCount > 0) {
          setNormalizationError(`The Excel file is missing ${missingHeaderCount} required header column(s) for normalization. Please ensure all columns (${expectedInputHeaders.join(', ')}) are present and correctly named.`);
          setIsNormalizing(false);
          return;
        }

        const itemsToTranslate: { id: string; text: string; originalColumn: string; rowIndex: number }[] = [];
        const processedRows: any[] = [];
        let translationIdCounter = 0;
        // Fix: Declare fieldsToTranslate outside the conditional translation block
        const fieldsToTranslate = ['Category', 'ItemName', 'Info'];

        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.filter(cell => cell !== undefined && cell !== null && String(cell).trim() !== '').length === 0) {
            setNormalizationWarnings(prev => [...prev, `Row ${i + 1}: Skipping empty row.`]);
            continue;
          }

          const productEntry: any = {};
          let rowHasCriticalError = false;

          for (const key in inputHeaderMap) {
            const propName = inputHeaderMap[key];
            const colIndex = headerIndices[propName];
            productEntry[propName] = String(row[colIndex] || '').trim();
          }

          // Collect texts for translation
          for (const field of fieldsToTranslate) {
            const originalText = productEntry[field];
            if (originalText && containsArabic(originalText)) {
              const id = `t-${translationIdCounter++}`;
              itemsToTranslate.push({ id, text: originalText, originalColumn: field, rowIndex: i - 1 });
            }
          }
          processedRows.push(productEntry);
        }

        setNormalizationFeedbackMessage(`Found ${processedRows.length} valid rows. Translating Arabic text...`);

        let translatedResultsMap = new Map<string, string>();
        if (itemsToTranslate.length > 0) {
          try {
            const translations = await translateTexts(itemsToTranslate.map(item => ({ id: item.id, text: item.text })), 'en');
            translations.forEach(t => translatedResultsMap.set(t.id, t.translatedText));
          } catch (translationError) {
            console.error('Translation failed:', translationError);
            setNormalizationError(`Failed to translate some texts: ${(translationError as Error).message}`);
            // Continue processing with untranslated originals for robustness
          }
        }

        const finalNormalizedData: NormalizedProductData[] = processedRows.map((p, index) => {
          const newEntry: NormalizedProductData = {
            Category_Arabic: p.Category,
            Category_English: p.Category, // Default to Arabic if no translation or already English
            ItemName_Arabic: p.ItemName,
            ItemName_English: p.ItemName,
            Info_Arabic: p.Info,
            Info_English: p.Info,
            CarCompany: p.CarCompany,
            CarModel: p.CarModel,
            CarInfo: p.CarInfo,
            Brand: p.Brand,
            OEM_Number: p.OEM_Number,
          };

          // Apply translations back
          fieldsToTranslate.forEach(field => {
            const originalText = p[field];
            if (originalText && containsArabic(originalText)) {
              const translationItem = itemsToTranslate.find(item => item.rowIndex === index && item.originalColumn === field);
              if (translationItem) {
                const translatedText = translatedResultsMap.get(translationItem.id);
                if (translatedText) {
                  (newEntry as any)[`${field}_English`] = translatedText;
                }
              }
            }
          });
          return newEntry;
        });

        if (finalNormalizedData.length > 0) {
          setNormalizedOutputData(finalNormalizedData);
          setNormalizationFeedbackMessage(`Normalization complete. ${finalNormalizedData.length} products processed. Ready for download.`);
        } else {
          setNormalizationError('No valid products could be normalized from the file.');
        }

      } catch (error) {
        console.error('Error during normalization:', error);
        setNormalizationError(`Error reading or processing Excel file: ${(error as Error).message}. Please ensure it's a valid .xlsx or .xlsm file and follows the specified format.`);
      } finally {
        setIsNormalizing(false);
        if (normalizeFileInputRef.current) {
          normalizeFileInputRef.current.value = ''; // Clear file input
        }
      }
    };
    reader.onerror = () => {
      setNormalizationError('Error reading file. Please try again.');
      setIsNormalizing(false);
      if (normalizeFileInputRef.current) {
        normalizeFileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(normalizeFile);
  }, [normalizeFile]);

  const handleDownloadJson = useCallback(() => {
    if (normalizedOutputData) {
      const filename = `normalized_autoparts_data_${new Date().toISOString().slice(0, 10)}.json`;
      const jsonStr = JSON.stringify(normalizedOutputData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [normalizedOutputData]);

  const handleDownloadCsv = useCallback(() => {
    if (normalizedOutputData) {
      const filename = `normalized_autoparts_data_${new Date().toISOString().slice(0, 10)}.csv`;
      const ws = XLSX.utils.json_to_sheet(normalizedOutputData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Normalized Data');
      XLSX.writeFile(wb, filename);
    }
  }, [normalizedOutputData]);

  return (
    <div className="container mx-auto my-8 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-blue-700 mb-6 border-b pb-4">
        {currentUser.name}'s Product Management
      </h2>

      <div>
        {editingProduct && (
          <>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Edit Product: {editingProduct.name}</h3>
            <form onSubmit={handleUpdateProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-6 border border-gray-200 rounded-lg shadow-sm">
              <div>
                <label htmlFor="editPartNumber" className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                <input
                  type="text"
                  id="editPartNumber"
                  name="partNumber"
                  value={editForm.partNumber}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="editProductName" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  id="editProductName"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="editProductMake" className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                <input
                  type="text"
                  id="editProductMake"
                  name="make"
                  value={editForm.make}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="editProductModel" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  id="editProductModel"
                  name="model"
                  value={editForm.model}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="editProductYear" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  id="editProductYear"
                  name="year"
                  value={editForm.year}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>
              <div>
                <label htmlFor="editProductPrice" className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  id="editProductPrice"
                  name="price"
                  value={editForm.price}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label htmlFor="editProductQuantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity Available (Stock)</label>
                <input
                  type="number"
                  id="editProductQuantity"
                  name="quantityAvailable"
                  value={editForm.quantityAvailable}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="editProductDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="editProductDescription"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              <div>
                <label htmlFor="editProductImageUrl" className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  id="editProductImageUrl"
                  name="imageUrl"
                  value={editForm.imageUrl}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="editProductCategory" className="block text-sm font-medium text-gray-700 mb-1">Category (Optional)</label>
                <input
                  type="text"
                  id="editProductCategory"
                  name="category"
                  value={editForm.category}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
               <div>
                <label htmlFor="editProductVehicleType" className="block text-sm font-medium text-gray-700 mb-1">General Vehicle Type (Optional)</label>
                <input
                  type="text"
                  id="editProductVehicleType"
                  name="vehicleType"
                  value={editForm.vehicleType}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-md transition-colors duration-300"
                  aria-label="Cancel editing product"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md shadow-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  aria-label="Update product"
                >
                  Update Product
                </button>
              </div>
            </form>
          </>
        )}

        {/* Existing Excel Upload Section (for adding to app's products) */}
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">Upload New Products to My Shop (Excel .xlsx or .xlsm)</h3>
        <p className="text-gray-600 mb-4">
          Upload an Excel file (.xlsx or .xlsm) with your product data. The first sheet should contain the following 8 columns in order:
          <br />
          <code className="bg-gray-100 p-1 rounded-sm text-sm block my-2">
            Part Number, Part Name, Make, Model, Year, Price, Stock, Description
          </code>
          <br />
          Example: <code className="bg-gray-100 p-1 rounded-sm text-sm">"BP-1001" | "Brake Pad Set (Front)" | "Toyota" | "Camry" | "2018" | "89.99" | "10" | "High-performance ceramic brake pads."</code>
          <br />
          <span className="font-semibold text-red-600">Important:</span> Ensure numerical values (Year, Price, Stock) are correctly formatted in Excel. If a description contains a comma, enclose the entire cell content in double quotes (e.g., "Shock absorber, gas-charged").
        </p>

        <div className="flex items-center space-x-4 mb-8">
          <label htmlFor="excel-upload" className="block text-sm font-medium text-gray-700 sr-only">Upload Excel File</label>
          <input
            type="file"
            id="excel-upload"
            ref={fileInputRef}
            accept=".xlsx, .xlsm"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100"
            aria-label="Upload Excel file for products"
          />
          <button
            onClick={handleUploadButtonClick}
            disabled={!selectedFile || uploadStatus === 'uploading'}
            className={`px-6 py-2 rounded-md font-semibold shadow-sm transition-colors duration-300
                        ${!selectedFile || uploadStatus === 'uploading'
                          ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'}`}
            aria-disabled={!selectedFile || uploadStatus === 'uploading'}
          >
            {uploadStatus === 'uploading' ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              'Add Products to Shop'
            )}
          </button>
        </div>

        {uploadFeedbackMessage && (
          <div
            className={`p-4 rounded-md text-sm mb-4 ${
              uploadStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
            role={uploadStatus === 'error' ? 'alert' : 'status'}
          >
            {uploadFeedbackMessage}
          </div>
        )}

        {uploadWarnings.length > 0 && (
          <details className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-8">
            <summary className="font-semibold cursor-pointer">
              {uploadWarnings.length} Warnings during upload (click to expand)
            </summary>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {uploadWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </details>
        )}

        {/* New Section: Normalize Auto Parts Data */}
        <div className="mt-12 border-t pt-8 border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Normalize and Download Auto Parts Data (Arabic/English)</h3>
          <p className="text-gray-600 mb-4">
            Upload an Excel file (.xlsx or .xlsm) with mixed Arabic and English auto parts data.
            The system will detect Arabic text in key fields, translate it to English, and
            output a structured file with both Arabic and English versions for easy search and database import.
          </p>
          <p className="text-gray-600 mb-4">
            Expected columns (order doesn't strictly matter but names must match):
            <br />
            <code className="bg-gray-100 p-1 rounded-sm text-sm block my-2">
              Category, Item Name, Info, Car Company, Car Model, Car Info, Brand, OEM Number
            </code>
            <br />
            <span className="font-semibold text-red-600">Note:</span> Brand names, car models, and OEM numbers will not be translated. Translations will focus on descriptive fields like Category, Item Name, and Info.
          </p>

          <div className="flex items-center space-x-4 mb-4">
            <label htmlFor="normalize-excel-upload" className="block text-sm font-medium text-gray-700 sr-only">Upload Excel File for Normalization</label>
            <input
              type="file"
              id="normalize-excel-upload"
              ref={normalizeFileInputRef}
              accept=".xlsx, .xlsm"
              onChange={handleNormalizeFileChange}
              className="block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-purple-50 file:text-purple-700
                         hover:file:bg-purple-100"
              aria-label="Upload Excel file for normalization"
            />
            <button
              onClick={handleNormalizeAndDownload}
              disabled={!normalizeFile || isNormalizing}
              className={`px-6 py-2 rounded-md font-semibold shadow-sm transition-colors duration-300
                          ${!normalizeFile || isNormalizing
                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
              aria-disabled={!normalizeFile || isNormalizing}
            >
              {isNormalizing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Normalizing...
                </span>
              ) : (
                'Normalize Data'
              )}
            </button>
          </div>

          {normalizationFeedbackMessage && (
            <div
              className={`p-4 rounded-md text-sm mb-4 ${
                !normalizationError ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
              }`}
              role={normalizationError ? 'alert' : 'status'}
            >
              {normalizationFeedbackMessage}
            </div>
          )}

          {normalizationError && (
             <div className="p-4 rounded-md text-sm mb-4 bg-red-100 text-red-800" role="alert">
               Error: {normalizationError}
             </div>
          )}

          {normalizationWarnings.length > 0 && (
            <details className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-8">
              <summary className="font-semibold cursor-pointer">
                {normalizationWarnings.length} Warnings during normalization (click to expand)
              </summary>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {normalizationWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </details>
          )}

          {normalizedOutputData && (
            <div className="mt-6 flex space-x-4">
              <button
                onClick={handleDownloadJson}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm transition-colors duration-300"
                aria-label="Download normalized data as JSON"
              >
                Download JSON
              </button>
              <button
                onClick={handleDownloadCsv}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm transition-colors duration-300"
                aria-label="Download normalized data as CSV"
              >
                Download CSV
              </button>
            </div>
          )}
        </div>


        <h3 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">My Current Products ({myProducts.length})</h3>
        {myProducts.length === 0 ? (
          <p className="text-gray-600">You haven't added any products yet. Upload an Excel file to get started!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th scope="col" className="px-6 py-3">Part #</th>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Make</th>
                  <th scope="col" className="px-6 py-3">Model</th>
                  <th scope="col" className="px-6 py-3">Year</th>
                  <th scope="col" className="px-6 py-3">Price</th>
                  <th scope="col" className="px-6 py-3">Stock</th>
                  <th scope="col" className="px-6 py-3">Description</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {myProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 font-medium text-gray-900">{product.partNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.make}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.quantityAvailable}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{product.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleStartEdit(product)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        aria-label={`Edit product ${product.name}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Are you sure you want to delete ${product.name}?`)) onDeleteProduct(product.id); }}
                        className="text-red-600 hover:text-red-900"
                        aria-label={`Delete product ${product.name}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierDashboard;