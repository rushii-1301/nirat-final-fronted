import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, FileText } from 'lucide-react';
import Sidebar from "../../Tools/Sidebar.jsx";
import Portalheader from "../../Tools/Portalheader.jsx";
import { BACKEND_API_URL } from "../../../utils/assets.js";
import axios from 'axios';

// Dynamically import PDF.js for page count detection
const loadPDFJS = async () => {
  if (typeof window !== 'undefined' && !window.pdfjsLib) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    document.body.appendChild(script);
    
    return new Promise((resolve) => {
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      };
    });
  }
};

export default function PDFSlideViewer({ theme, isDark, toggleTheme, sidebardata }) {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(150); // Set actual page count
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [userInput, setUserInput] = useState('1');
  const [error, setError] = useState(null);
  const [bookData, setBookData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('continuous'); // 'single' or 'continuous'
  const [pdfNotFound, setPdfNotFound] = useState(false);

  // Get book ID from navigation state
  const bookId = location.state?.bookId;

  // Fetch book data by ID
  useEffect(() => {
    const fetchBookById = async () => {
      if (!bookId) {
        // If no bookId, show empty state
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("Student token not found in localStorage");
        setLoading(false);
        return;
      }

      try {
        // Fetch all books and find the one with matching ID
        const res = await axios.get(`${BACKEND_API_URL}/school-portal/books`, {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = res.data || {};
        let booksList = [];

        if (Array.isArray(data)) {
          booksList = data;
        } else if (data.data && Array.isArray(data.data.books)) {
          booksList = data.data.books;
        } else if (Array.isArray(data.data)) {
          booksList = data.data;
        } else if (Array.isArray(data.books)) {
          booksList = data.books;
        }

        // Find the specific book by ID
        const specificBook = booksList.find(book => book.id === bookId);
        
        if (specificBook) {
          console.log('Found book:', specificBook);
          setBookData({
            pdfUrl: `${BACKEND_API_URL}${specificBook.file_url}`,
            title: specificBook.title,
            totalPages: 150
          });
        } else {
          console.log('Book not found');
          // Don't set fallback PDF, let it show empty state
        }
      } catch (error) {
        console.error('Failed to fetch book data:', error);
        // Don't set fallback PDF on error
      } finally {
        setLoading(false);
      }
    };

    fetchBookById();
  }, [bookId]);

  // Debug: Log the book data
  console.log('Book ID:', bookId);
  console.log('Book Data:', bookData);

  // If no PDF URL, don't set fallback
  let finalPdfUrl = bookData?.pdfUrl;
  if (finalPdfUrl && finalPdfUrl.includes('192.168.1.53')) {
    // Backend not accessible, don't use fallback
    finalPdfUrl = null;
    console.log('Backend not accessible, no PDF available');
  }

  // Debug: Log the final PDF URL being used
  console.log('Final PDF URL:', finalPdfUrl);

  const pdfFile = finalPdfUrl;

  useEffect(() => {
    // Load PDF and detect page count
    const loadPDFAndDetectPages = async () => {
      try {
        await loadPDFJS();
        
        if (window.pdfjsLib && pdfFile) {
          const loadingTask = window.pdfjsLib.getDocument(pdfFile);
          const pdf = await loadingTask.promise;
          setTotalPages(pdf.numPages);
          console.log(`PDF loaded with ${pdf.numPages} pages`);
          setPdfNotFound(false);
        }
      } catch (error) {
        console.error('Error detecting PDF pages:', error);
        // Check if it's a backend "Not Found" response - if so, don't show error UI
        const isBackendNotFound = error.message && (
          error.message.includes('Not Found') || 
          error.message.includes('404') ||
          error.name === 'InvalidPDFException'
        );
        
        if (isBackendNotFound) {
          console.log('Backend returned Not Found, using fallback PDF silently');
          setPdfNotFound(false); // Ensure error UI is not shown
        } else {
          // For other PDF errors, show the error UI
          setPdfNotFound(true);
          console.log('PDF not found, showing error UI');
        }
        // Fallback to default page count
        setTotalPages(bookData?.totalPages || 150);
      } finally {
        setLoading(false);
        setPdfLoaded(true);
      }
    };

    if (pdfFile) {
      loadPDFAndDetectPages();
    }
  }, [pdfFile, bookData?.totalPages]);

  // Update input field when currentPage changes
  useEffect(() => {
    setUserInput(currentPage.toString());
  }, [currentPage]);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
      setIframeKey((prev) => prev + 1); // Force iframe reload
    }
  };

  const prevPage = () => {
    setCurrentPage((p) => (p > 1 ? p - 1 : 1));
    if (currentPage > 1) {
      setIframeKey((prev) => prev + 1); // Force iframe reload
    }
  };

  const zoomIn = () => {
    setZoom((z) => Math.min(2, z + 0.2));
    setIframeKey((prev) => prev + 1); // Force iframe reload
  };

  const zoomOut = () => {
    setZoom((z) => Math.max(0.6, z - 0.2));
    setIframeKey((prev) => prev + 1); // Force iframe reload
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'single' ? 'continuous' : 'single');
    setIframeKey(prev => prev + 1); // Force iframe reload
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePageInput = (e) => {
    const value = e.target.value;
    setUserInput(value);
    
    const page = parseInt(value);
    if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setIframeKey((prev) => prev + 1); // Force iframe reload
    }
  };

  const handlePageInputBlur = () => {
    const page = parseInt(userInput);
    if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setIframeKey((prev) => prev + 1); // Force iframe reload
    } else {
      setUserInput(currentPage.toString());
    }
  };

  const handlePageInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(userInput);
      if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        setIframeKey((prev) => prev + 1); // Force iframe reload
      } else {
        setUserInput(currentPage.toString());
      }
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight') {
        nextPage();
      }
      if (e.key === 'ArrowLeft') {
        prevPage();
      }
      if (e.key === '+' || e.key === '=') {
        zoomIn();
      }
      if (e.key === '-' || e.key === '_') {
        zoomOut();
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, zoom]);

  if (loading) {
    return (
      <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-100 text-zinc-900"} h-screen transition-colors duration-300`}>
        {/* Conditionally render sidebar based on fullscreen state */}
        {!isFullscreen && <Sidebar isDark={isDark} sidebardata={sidebardata} />}
        
        <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full ${isFullscreen ? 'px-0 pb-0' : 'md:ml-15 lg:ml-72 px-0 pb-0'} transition-all duration-300`}>
          <div className="sticky top-0 z-20">
            <Portalheader title={bookData?.title || "PDF Viewer"} isDark={isDark} toggleTheme={toggleTheme} />
          </div>
          <main className={`${isFullscreen ? '' : 'mt-4'} flex-1 flex items-center justify-center min-h-0 p-8`}>
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-medium">Loading PDF...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show PDF not found UI if PDF failed to load
  if (pdfNotFound) {
    return (
      <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-100 text-zinc-900"} h-screen transition-colors duration-300`}>
        {/* Conditionally render sidebar based on fullscreen state */}
        {!isFullscreen && <Sidebar isDark={isDark} sidebardata={sidebardata} />}
        
        <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full ${isFullscreen ? 'px-0 pb-0' : 'md:ml-15 lg:ml-72 px-0 pb-0'} transition-all duration-300`}>
          <div className="sticky top-0 z-20">
            <Portalheader title="PDF Not Found" isDark={isDark} toggleTheme={toggleTheme} />
          </div>
          <main className={`${isFullscreen ? '' : 'mt-4'} flex-1 flex items-center justify-center min-h-0 p-8`}>
            <div className="text-center max-w-md">
              <div className={`w-20 h-20 ${isDark ? 'bg-red-900/20' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <FileText className="w-10 h-10 text-red-500" />
              </div>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                PDF Not Found
              </h2>
              <p className={`${isDark ? 'text-gray-400' : 'text-black'} mb-6`}>
                The PDF file you're looking for could not be loaded. Please check if the file exists or try again later.
              </p>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-white'} mb-6`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-black'}`}>
                  <strong>File attempted:</strong><br />
                  <span className="text-xs font-mono break-all">{pdfFile}</span>
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className={`px-6 py-2 ${isDark ? 'bg-white hover:bg-gray-100 text-gray-900' : 'bg-[#3498db] hover:bg-purple-700 text-white'} cursor-pointer rounded-lg transition-colors`}
              >
                Try Again
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-100 text-zinc-900"} h-screen transition-colors duration-300`}>
      {/* Conditionally render sidebar based on fullscreen state */}
      {!isFullscreen && <Sidebar isDark={isDark} sidebardata={sidebardata} />}

      {/* Main Content - Full width when fullscreen, normal when not */}
      <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full ${isFullscreen ? 'px-0 pb-0' : 'md:ml-15 lg:ml-72 px-0 pb-0'} transition-all duration-300`}>
        <div className="sticky top-0 z-20">
          <Portalheader title={bookData?.title || "PDF Viewer"} isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        <main className={`${isFullscreen ? '' : 'mt-6'} flex-1 flex flex-col min-h-0 px-4 md:px-8`}>
          {/* PDF Viewer - Full Container */}
          <div className="flex-1 overflow-hidden">
            <iframe
              key={iframeKey}
              src={`${pdfFile}#toolbar=0&navpanes=0&scrollbar=${viewMode === 'continuous' ? '1' : '0'}&page=${currentPage}&zoom=${Math.round(zoom * 100)}&view=${viewMode === 'continuous' ? 'FitH' : 'SinglePage'}`}
              className="w-full h-full"
              style={{ 
                width: '100%', 
                height: '100%',
                border: 'none',
                display: 'block'
              }}
              title="PDF Viewer"
            />
          </div>

          {/* Floating Control Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-30">
            <div className={`${isDark ? 'bg-zinc-900/90' : 'bg-white/90'} backdrop-blur border ${isDark ? 'border-zinc-700' : 'border-gray-300'} rounded-lg px-4 py-3 max-w-md mx-auto`}>
              <div className="flex items-center justify-between gap-3">
                {/* Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white p-2 rounded transition-all"
                    title="Previous (←)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    value={userInput}
                    onChange={handlePageInput}
                    onBlur={handlePageInputBlur}
                    onKeyPress={handlePageInputKeyPress}
                    className={`w-14 ${isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-900'} text-center text-sm rounded px-2 py-1 outline-none border ${isDark ? 'border-zinc-700' : 'border-gray-300'}`}
                    min="1"
                    max={totalPages}
                    placeholder="1"
                  />

                  <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>
                    / {totalPages}
                  </span>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white p-2 rounded transition-all"
                    title="Next (→)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={zoomOut}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-all"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <span className="text-white bg-purple-600/70 px-3 py-1 rounded text-sm min-w-[50px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>

                  <button
                    onClick={zoomIn}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-all"
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleViewMode}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-all ml-1"
                    title={`View Mode: ${viewMode === 'single' ? 'Single Page' : 'Continuous Scroll'}`}
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-all ml-1"
                    title="Fullscreen (F)"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
            <div className={`${isDark ? 'bg-zinc-800/80' : 'bg-gray-800/80'} text-white text-xs px-3 py-1 rounded-full backdrop-blur`}>
              ← → : Navigate | + - : Zoom | F : Fullscreen | Esc : Exit
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


// import React, { useState, useEffect, useRef } from 'react';
// import { useLocation } from 'react-router-dom';
// import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, FileText } from 'lucide-react';
// import Sidebar from "../../Tools/Sidebar.jsx";
// import Portalheader from "../../Tools/Portalheader.jsx";
// import { BACKEND_API_URL } from "../../../utils/assets.js";
// import axios from 'axios';

// // Dynamically import PDF.js for page count detection
// const loadPDFJS = async () => {
//   if (typeof window !== 'undefined' && !window.pdfjsLib) {
//     const script = document.createElement('script');
//     script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
//     script.async = true;
//     document.body.appendChild(script);
    
//     return new Promise((resolve) => {
//       script.onload = () => {
//         window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
//         resolve();
//       };
//     });
//   }
// };

// export default function PDFSlideViewer({ theme, isDark, toggleTheme, sidebardata }) {
//   const location = useLocation();
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(150); // Set actual page count
//   const [zoom, setZoom] = useState(1);
//   const [loading, setLoading] = useState(true);
//   const [pdfLoaded, setPdfLoaded] = useState(false);
//   const [iframeKey, setIframeKey] = useState(0);
//   const [userInput, setUserInput] = useState('1');
//   const [error, setError] = useState(null);
//   const [bookData, setBookData] = useState(null);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [viewMode, setViewMode] = useState('single'); // 'single' or 'continuous'
//   const iframeRef = useRef(null);

//   // Get book ID from navigation state
//   const bookId = location.state?.bookId;

//   // Fetch book data by ID
//   useEffect(() => {
//     const fetchBookById = async () => {
//       if (!bookId) {
//         // If no bookId, use fallback data
//         setBookData({
//           pdfUrl: "/PDF/GSEB-Board-Class-8-Social-Science-Textbook-Gujarati-Medium-Semester-2.pdf",
//           title: "PDF Viewer",
//           totalPages: 150
//         });
//         setLoading(false);
//         return;
//       }

//       const token = localStorage.getItem('token');
//       if (!token) {
//         console.warn("Student token not found in localStorage");
//         setLoading(false);
//         return;
//       }

//       try {
//         // Fetch all books and find the one with matching ID
//         const res = await axios.get(`${BACKEND_API_URL}/school-portal/books`, {
//           headers: {
//             accept: 'application/json',
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         const data = res.data || {};
//         let booksList = [];

//         if (Array.isArray(data)) {
//           booksList = data;
//         } else if (data.data && Array.isArray(data.data.books)) {
//           booksList = data.data.books;
//         } else if (Array.isArray(data.data)) {
//           booksList = data.data;
//         } else if (Array.isArray(data.books)) {
//           booksList = data.books;
//         }

//         // Find the specific book by ID
//         const specificBook = booksList.find(book => book.id === bookId);
        
//         if (specificBook) {
//           console.log('Found book:', specificBook);
//           setBookData({
//             pdfUrl: `${BACKEND_API_URL}${specificBook.file_url}`,
//             title: specificBook.title,
//             totalPages: 150
//           });
//         } else {
//           console.log('Book not found, using fallback');
//           setBookData({
//             pdfUrl: "/PDF/GSEB-Board-Class-8-Social-Science-Textbook-Gujarati-Medium-Semester-2.pdf",
//             title: "PDF Viewer",
//             totalPages: 150
//           });
//         }
//       } catch (error) {
//         console.error('Failed to fetch book data:', error);
//         setBookData({
//           pdfUrl: "/PDF/GSEB-Board-Class-8-Social-Science-Textbook-Gujarati-Medium-Semester-2.pdf",
//           title: "PDF Viewer",
//           totalPages: 150
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchBookById();
//   }, [bookId]);

//   // Debug: Log the book data
//   console.log('Book ID:', bookId);
//   console.log('Book Data:', bookData);

//   // If API PDF URL is provided but backend is not accessible, fallback to local PDF
//   let finalPdfUrl = bookData?.pdfUrl || "/PDF/GSEB-Board-Class-8-Social-Science-Textbook-Gujarati-Medium-Semester-2.pdf";
//   if (finalPdfUrl.includes('192.168.1.53')) {
//     // Backend not accessible, use local fallback PDF
//     finalPdfUrl = "/PDF/GSEB-Board-Class-8-Social-Science-Textbook-Gujarati-Medium-Semester-2.pdf";
//     console.log('Backend not accessible, using local PDF fallback');
//   }

//   // Debug: Log the final PDF URL being used
//   console.log('Final PDF URL:', finalPdfUrl);

//   const pdfFile = finalPdfUrl;

//   useEffect(() => {
//     // Load PDF and detect page count
//     const loadPDFAndDetectPages = async () => {
//       try {
//         await loadPDFJS();
        
//         if (window.pdfjsLib && pdfFile) {
//           const loadingTask = window.pdfjsLib.getDocument(pdfFile);
//           const pdf = await loadingTask.promise;
//           setTotalPages(pdf.numPages);
//           console.log(`PDF loaded with ${pdf.numPages} pages`);
//         }
//       } catch (error) {
//         console.error('Error detecting PDF pages:', error);
//         // Fallback to default page count
//         setTotalPages(bookData?.totalPages || 150);
//       } finally {
//         setLoading(false);
//         setPdfLoaded(true);
//       }
//     };

//     if (pdfFile) {
//       loadPDFAndDetectPages();
//     }
//   }, [pdfFile, bookData?.totalPages]);

//   // Update input field when currentPage changes
//   useEffect(() => {
//     setUserInput(currentPage.toString());
//   }, [currentPage]);

//   const nextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage((p) => p + 1);
//       setIframeKey((prev) => prev + 1); // Force iframe reload
//     }
//   };

//   const prevPage = () => {
//     setCurrentPage((p) => (p > 1 ? p - 1 : 1));
//     if (currentPage > 1) {
//       setIframeKey((prev) => prev + 1); // Force iframe reload
//     }
//   };

//   const zoomIn = () => {
//     setZoom((z) => Math.min(2, z + 0.2));
//   };

//   const zoomOut = () => {
//     setZoom((z) => Math.max(0.6, z - 0.2));
//   };

//   const toggleViewMode = () => {
//     setViewMode(prev => prev === 'single' ? 'continuous' : 'single');
//     setIframeKey(prev => prev + 1); // Force iframe reload
//   };

//   const toggleFullscreen = () => {
//     if (!document.fullscreenElement) {
//       document.documentElement.requestFullscreen().then(() => {
//         setIsFullscreen(true);
//       }).catch((err) => {
//         console.error('Error attempting to enable fullscreen:', err);
//       });
//     } else {
//       document.exitFullscreen().then(() => {
//         setIsFullscreen(false);
//       }).catch((err) => {
//         console.error('Error attempting to exit fullscreen:', err);
//       });
//     }
//   };

//   useEffect(() => {
//     const handleFullscreenChange = () => {
//       setIsFullscreen(!!document.fullscreenElement);
//     };

//     document.addEventListener('fullscreenchange', handleFullscreenChange);
//     return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
//   }, []);

//   const handlePageInput = (e) => {
//     const value = e.target.value;
//     setUserInput(value);
    
//     const page = parseInt(value);
//     if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
//       setCurrentPage(page);
//       setIframeKey((prev) => prev + 1); // Force iframe reload
//     }
//   };

//   const handlePageInputBlur = () => {
//     const page = parseInt(userInput);
//     if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
//       setCurrentPage(page);
//       setIframeKey((prev) => prev + 1); // Force iframe reload
//     } else {
//       setUserInput(currentPage.toString());
//     }
//   };

//   const handlePageInputKeyPress = (e) => {
//     if (e.key === 'Enter') {
//       const page = parseInt(userInput);
//       if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
//         setCurrentPage(page);
//         setIframeKey((prev) => prev + 1); // Force iframe reload
//       } else {
//         setUserInput(currentPage.toString());
//       }
//     }
//   };

//   useEffect(() => {
//     const handleKeyPress = (e) => {
//       if (e.key === 'ArrowRight') {
//         nextPage();
//       }
//       if (e.key === 'ArrowLeft') {
//         prevPage();
//       }
//       if (e.key === '+' || e.key === '=') {
//         zoomIn();
//       }
//       if (e.key === '-' || e.key === '_') {
//         zoomOut();
//       }
//       if (e.key === 'f' || e.key === 'F') {
//         toggleFullscreen();
//       }
//       if (e.key === 'Escape' && document.fullscreenElement) {
//         document.exitFullscreen();
//       }
//     };

//     window.addEventListener('keydown', handleKeyPress);
//     return () => window.removeEventListener('keydown', handleKeyPress);
//   }, [currentPage, zoom]);

//   if (loading) {
//     return (
//       <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-100 text-zinc-900"} h-screen transition-colors duration-300`}>
//         {/* Conditionally render sidebar based on fullscreen state */}
//         {!isFullscreen && <Sidebar isDark={isDark} sidebardata={sidebardata} />}
        
//         <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full ${isFullscreen ? 'p-0 pb-0' : 'md:ml-20 lg:ml-72 p-4 pb-0'} transition-all duration-300`}>
//           <div className="sticky top-0 z-20">
//             <Portalheader title={bookData?.title || "PDF Viewer"} isDark={isDark} toggleTheme={toggleTheme} />
//           </div>
//           <main className={`${isFullscreen ? '' : 'mt-4'} flex-1 flex items-center justify-center min-h-0`}>
//             <div className="text-center">
//               <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
//               <p className="text-sm font-medium">Loading PDF...</p>
//             </div>
//           </main>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-100 text-zinc-900"} h-screen transition-colors duration-300`}>
//       {/* Conditionally render sidebar based on fullscreen state */}
//       {!isFullscreen && <Sidebar isDark={isDark} sidebardata={sidebardata} />}

//       {/* Main Content - Full width when fullscreen, normal when not */}
//       <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full ${isFullscreen ? 'p-0 pb-0' : 'md:ml-15 lg:ml-72 p-7 pb-0'} transition-all duration-300`}>
//         <div className="sticky top-0 z-20">
//           <Portalheader title={bookData?.title || "PDF Viewer"} isDark={isDark} toggleTheme={toggleTheme} />
//         </div>

//         <main className={`${isFullscreen ? '' : 'mt-6'} flex-1 flex flex-col min-h-0`}>
//           {/* PDF Viewer - Full Container */}
//           <div className="flex-1 overflow-hidden">
//             <iframe
//               ref={iframeRef}
//               src={`${pdfFile}#toolbar=0&navpanes=0&scrollbar=${viewMode === 'continuous' ? '1' : '0'}&page=${currentPage}&zoom=${Math.round(zoom * 100)}&view=${viewMode === 'continuous' ? 'FitH' : 'SinglePage'}`}
//               className="w-full h-full"
//               style={{ 
//                 width: '100%', 
//                 height: '100%',
//                 border: 'none',
//                 display: 'block',
//                 transform: `scale(${zoom})`,
//                 transformOrigin: 'top left'
//               }}
//               title="PDF Viewer"
//             />
//           </div>

//           {/* Floating Control Bar */}
//           <div className="absolute bottom-4 left-4 right-4 z-30">
//             <div className={`${isDark ? 'bg-zinc-900/90' : 'bg-white/90'} backdrop-blur border ${isDark ? 'border-zinc-700' : 'border-gray-300'} rounded-lg px-4 py-3 max-w-md mx-auto`}>
//               <div className="flex items-center justify-between gap-3">
//                 {/* Navigation */}
//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={prevPage}
//                     disabled={currentPage === 1}
//                     className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white p-2 rounded transition-all"
//                     title="Previous (←)"
//                   >
//                     <ChevronLeft className="w-4 h-4" />
//                   </button>

//                   <input
//                     type="number"
//                     value={userInput}
//                     onChange={handlePageInput}
//                     onBlur={handlePageInputBlur}
//                     onKeyPress={handlePageInputKeyPress}
//                     className={`w-14 ${isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-900'} text-center text-sm rounded px-2 py-1 outline-none border ${isDark ? 'border-zinc-700' : 'border-gray-300'}`}
//                     min="1"
//                     max={totalPages}
//                     placeholder="1"
//                   />

//                   <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>
//                     / {totalPages}
//                   </span>

//                   <button
//                     onClick={nextPage}
//                     disabled={currentPage === totalPages}
//                     className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white p-2 rounded transition-all"
//                     title="Next (→)"
//                   >
//                     <ChevronRight className="w-4 h-4" />
//                   </button>
//                 </div>

//                 {/* Zoom Controls */}
//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={zoomOut}
//                     className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-all"
//                     title="Zoom Out (-)"
//                   >
//                     <ZoomOut className="w-4 h-4" />
//                   </button>

//                   <span className="text-white bg-purple-600/70 px-3 py-1 rounded text-sm min-w-[50px] text-center">
//                     {Math.round(zoom * 100)}%
//                   </span>

//                   <button
//                     onClick={zoomIn}
//                     className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-all"
//                     title="Zoom In (+)"
//                   >
//                     <ZoomIn className="w-4 h-4" />
//                   </button>

//                   <button
//                     onClick={toggleViewMode}
//                     className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-all ml-1"
//                     title={`View Mode: ${viewMode === 'single' ? 'Single Page' : 'Continuous Scroll'}`}
//                   >
//                     <FileText className="w-4 h-4" />
//                   </button>

//                   <button
//                     onClick={toggleFullscreen}
//                     className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-all ml-1"
//                     title="Fullscreen (F)"
//                   >
//                     <Maximize2 className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Keyboard Shortcuts Hint */}
//           <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
//             <div className={`${isDark ? 'bg-zinc-800/80' : 'bg-gray-800/80'} text-white text-xs px-3 py-1 rounded-full backdrop-blur`}>
//               ← → : Navigate | + - : Zoom | F : Fullscreen | Esc : Exit
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

// import React, { useState, useEffect } from 'react';
// import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Upload, FileText } from 'lucide-react';

// export default function PDFViewer() {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [scale, setScale] = useState(1.2);
//   const [rotation, setRotation] = useState(0);
//   const [numPages, setNumPages] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [pdfDoc, setPdfDoc] = useState(null);
//   const [pdfLoaded, setPdfLoaded] = useState(false);
//   const [viewMode, setViewMode] = useState('continuous'); // 'single' or 'continuous'

//   // Auto-load the English_Syllabus.pdf on component mount
//   useEffect(() => {
//     loadDefaultPDF();
//   }, []);

//   const loadDefaultPDF = async () => {
//     setLoading(true);
//     try {
//       // Load PDF.js from CDN first - try a different version
//       if (!window.pdfjsLib) {
//         const script = document.createElement('script');
//         script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
//         script.async = true;
        
//         script.onload = async () => {
//           console.log('PDF.js loaded, version:', window.pdfjsLib.version);
//           window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
//             'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
//           await loadPDFFile();
//         };
        
//         document.body.appendChild(script);
//       } else {
//         await loadPDFFile();
//       }
//     } catch (error) {
//       console.error('Error loading default PDF:', error);
//       setLoading(false);
//     }
//   };

//   const loadPDFFile = async () => {
//     try {
//       // Wait a moment for PDF.js to be fully ready
//       await new Promise(resolve => setTimeout(resolve, 500));
      
//       // Load the GSEB textbook PDF file
//       console.log('Loading PDF from: /PDF/GSEB-Board-Class-8-Social-Science-Textbook-Gujarati-Medium-Semester-2.pdf');
//       const pdf = await window.pdfjsLib.getDocument('/PDF/GSEB-Board-Class-8-Social-Science-Textbook-Gujarati-Medium-Semester-2.pdf').promise;
//       console.log('PDF loaded successfully, pages:', pdf.numPages);
//       setPdfDoc(pdf);
//       setNumPages(pdf.numPages);
//       setCurrentPage(1);
//       setPdfLoaded(true);
//       setLoading(false);
//     } catch (error) {
//       console.error('Error loading PDF file:', error);
//       setLoading(false);
//     }
//   };

//   const handleFileUpload = async (event) => {
//     const file = event.target.files[0];
//     if (!file || file.type !== 'application/pdf') {
//       alert('Please select a valid PDF file');
//       return;
//     }

//     setLoading(true);
//     const fileReader = new FileReader();
    
//     fileReader.onload = async function() {
//       const typedarray = new Uint8Array(this.result);
      
//       try {
//         const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
//         setPdfDoc(pdf);
//         setNumPages(pdf.numPages);
//         setCurrentPage(1);
//         setPdfLoaded(true);
//         setLoading(false);
//       } catch (error) {
//         console.error('Error loading PDF:', error);
//         alert('Failed to load PDF. Please try another file.');
//         setLoading(false);
//       }
//     };
    
//     fileReader.readAsArrayBuffer(file);
//   };

//   const handlePrevPage = () => {
//     console.log('Previous page clicked, current page:', currentPage);
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//     }
//   };

//   const handleNextPage = () => {
//     console.log('Next page clicked, current page:', currentPage, 'total pages:', numPages);
//     if (currentPage < numPages) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   const handleZoomIn = () => {
//     setScale(prev => Math.min(prev + 0.2, 3.0));
//   };

//   const handleZoomOut = () => {
//     setScale(prev => Math.max(prev - 0.2, 0.5));
//   };

//   const handleRotate = () => {
//     setRotation(prev => (prev + 90) % 360);
//   };

//   const toggleViewMode = () => {
//     setViewMode(prev => (prev === 'single' ? 'continuous' : 'single'));
//   };

//   useEffect(() => {
//     if (pdfDoc && pdfLoaded) {
//       renderPage();
//     }
//   }, [currentPage, scale, rotation, pdfDoc, pdfLoaded, viewMode]);

//   const renderPage = async () => {
//     if (!pdfDoc) return;

//     try {
//       console.log('Rendering in', viewMode, 'mode');
//       const canvas = document.getElementById('pdf-canvas');
      
//       if (!canvas) {
//         console.error('Canvas not found!');
//         return;
//       }
      
//       const context = canvas.getContext('2d');
//       console.log('Canvas found:', canvas.width, 'x', canvas.height);
//       console.log('Context:', context);

//       // Test canvas with a simple rectangle first
//       canvas.width = 800;
//       canvas.height = 600;
//       context.fillStyle = 'red';
//       context.fillRect(50, 50, 200, 100);
//       context.fillStyle = 'black';
//       context.font = '20px Arial';
//       context.fillText('Canvas Test - If you see this, canvas works!', 50, 200);
      
//       // Wait a moment to see the test
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       if (viewMode === 'single') {
//         // Single page mode - render only current page
//         console.log('Rendering single page:', currentPage, 'of', numPages);
//         const page = await pdfDoc.getPage(currentPage);
//         const viewport = page.getViewport({ scale: scale, rotation: rotation });
        
//         console.log('Viewport dimensions:', viewport.width, 'x', viewport.height);
        
//         canvas.height = viewport.height;
//         canvas.width = viewport.width;
        
//         // Clear canvas before rendering
//         context.fillStyle = 'white';
//         context.fillRect(0, 0, canvas.width, canvas.height);

//         const renderContext = {
//           canvasContext: context,
//           viewport: viewport
//         };

//         console.log('Starting single page render...');
//         await page.render(renderContext).promise;
//         console.log('Single page rendered successfully:', currentPage);
//       } else {
//         // Continuous mode - render all pages
//         console.log('Rendering all pages for continuous scroll');
        
//         // Calculate total dimensions needed
//         let totalHeight = 0;
//         let maxWidth = 0;
//         const pageData = [];

//         for (let i = 1; i <= numPages; i++) {
//           const page = await pdfDoc.getPage(i);
//           const viewport = page.getViewport({ scale: scale, rotation: rotation });
//           pageData.push({ page, viewport });
//           totalHeight += viewport.height + 20; // Add 20px spacing between pages
//           if (viewport.width > maxWidth) {
//             maxWidth = viewport.width;
//           }
//         }

//         console.log('Total canvas size:', maxWidth, 'x', totalHeight);
        
//         // Set canvas size for all pages
//         canvas.height = totalHeight;
//         canvas.width = maxWidth;
        
//         // Clear canvas before rendering
//         context.fillStyle = 'white';
//         context.fillRect(0, 0, canvas.width, canvas.height);

//         // Render all pages
//         let yOffset = 0;
//         for (let i = 0; i < pageData.length; i++) {
//           const { page, viewport } = pageData[i];
//           console.log(`Rendering page ${i + 1} at offset ${yOffset}`);
          
//           const renderContext = {
//             canvasContext: context,
//             viewport: viewport,
//             transform: [1, 0, 0, 1, 0, yOffset]
//           };

//           await page.render(renderContext).promise;
//           yOffset += viewport.height + 20; // Add spacing between pages
//         }
        
//         console.log('All pages rendered successfully in continuous mode');
//       }
//     } catch (err) {
//       console.error('Error rendering page:', err);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-700 text-lg font-medium">Loading PDF...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!pdfLoaded) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
//         <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full mx-4">
//           <div className="text-center mb-6">
//             <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
//               <Upload className="w-10 h-10 text-blue-600" />
//             </div>
//             <h2 className="text-2xl font-bold text-gray-800 mb-2">PDF Viewer</h2>
//             <p className="text-gray-600">Upload a PDF file to view</p>
//           </div>

//           <label className="block">
//             <input
//               type="file"
//               accept="application/pdf"
//               onChange={handleFileUpload}
//               className="hidden"
//               id="pdf-upload"
//             />
//             <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
//               <Upload className="w-12 h-12 text-blue-400 mx-auto mb-3" />
//               <p className="text-gray-700 font-medium mb-1">Click to upload PDF</p>
//               <p className="text-sm text-gray-500">or drag and drop</p>
//             </div>
//           </label>

//           <div className="mt-6 p-4 bg-blue-50 rounded-lg">
//             <p className="text-sm text-gray-600 text-center">
//               📄 Supports standard PDF files<br />
//               🔒 Files are processed locally in your browser
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
//       {/* Header */}
//       <div className="bg-white shadow-lg">
//         <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
//           <div>
//             <h1 className="text-xl font-bold text-gray-800">📄 PDF Viewer</h1>
//             <p className="text-sm text-gray-500">{numPages} pages loaded</p>
//           </div>
//           <label className="cursor-pointer">
//             <input
//               type="file"
//               accept="application/pdf"
//               onChange={handleFileUpload}
//               className="hidden"
//             />
//             <div className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2">
//               <Upload className="w-4 h-4" />
//               Upload New PDF
//             </div>
//           </label>
//         </div>
        
//         {/* Controls Bar */}
//         <div className="p-4 flex items-center justify-between flex-wrap gap-4">
//           <div className="flex items-center gap-2">
//             <button
//               onClick={handlePrevPage}
//               disabled={currentPage === 1}
//               className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition bg-white border border-gray-300"
//               title="Previous Page"
//             >
//               <ChevronLeft className="w-5 h-5" />
//             </button>
            
//             <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
//               <input
//                 type="number"
//                 value={currentPage}
//                 onChange={(e) => {
//                   const page = parseInt(e.target.value);
//                   if (page >= 1 && page <= numPages) {
//                     setCurrentPage(page);
//                   }
//                 }}
//                 className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm font-medium"
//                 min="1"
//                 max={numPages}
//               />
//               <span className="text-sm font-medium text-gray-600">
//                 / {numPages}
//               </span>
//             </div>

//             <button
//               onClick={handleNextPage}
//               disabled={currentPage === numPages}
//               className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition bg-white border border-gray-300"
//               title="Next Page"
//             >
//               <ChevronRight className="w-5 h-5" />
//             </button>
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               onClick={handleZoomOut}
//               className="p-2 rounded-lg hover:bg-gray-100 transition bg-white border border-gray-300"
//               title="Zoom Out"
//             >
//               <ZoomOut className="w-5 h-5" />
//             </button>
            
//             <span className="text-sm font-medium px-3 py-2 bg-white rounded-lg border border-gray-300 min-w-[70px] text-center">
//               {Math.round(scale * 100)}%
//             </span>

//             <button
//               onClick={handleZoomIn}
//               className="p-2 rounded-lg hover:bg-gray-100 transition bg-white border border-gray-300"
//               title="Zoom In"
//             >
//               <ZoomIn className="w-5 h-5" />
//             </button>

//             <button
//               onClick={handleRotate}
//               className="p-2 rounded-lg hover:bg-gray-100 transition bg-white border border-gray-300 ml-2"
//               title="Rotate"
//             >
//               <RotateCw className="w-5 h-5" />
//             </button>

//             <button
//               onClick={toggleViewMode}
//               className="p-2 rounded-lg hover:bg-gray-100 transition bg-white border border-gray-300 ml-2"
//               title={`View Mode: ${viewMode === 'single' ? 'Single Page' : 'Continuous Scroll'}`}
//             >
//               <FileText className="w-5 h-5" />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* PDF Display Area */}
//       <div className="flex-1 overflow-auto p-6">
//         <div className="flex justify-center">
//           <div className="bg-white shadow-2xl">
//             <canvas 
//               id="pdf-canvas" 
//               className="max-w-full h-auto"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="bg-white border-t border-gray-200 px-6 py-3">
//         <div className="flex items-center justify-between text-sm text-gray-600">
//           <span>Use arrow buttons or scroll to navigate</span>
//           <span>Zoom: {Math.round(scale * 100)}% • Page: {currentPage}/{numPages}</span>
//         </div>
//       </div>
//     </div>
//   );
// }