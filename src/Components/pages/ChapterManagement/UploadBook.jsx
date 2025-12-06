import React, { useRef, useState, useEffect } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { RotateCcw, X, ChevronDown, ChevronUp } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_API_URL, handlesuccess } from "../../../utils/assets";

function UploadBook({ theme = "dark", isDark: isDarkProp, toggleTheme, sidebardata, suggestion = true, backto }) {
  const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";

  // Read navigation state coming from AddChapter / Suggestions
  const location = useLocation();
  const navState = location.state || {};
  const navigate = useNavigate();

  const selectedIds = Array.isArray(navState.selectedIds) ? navState.selectedIds : [];
  const formData = navState.form || {}; // Extract form data from navigation state

  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hasUploadedFile, setHasUploadedFile] = useState(false); // Track if file was uploaded successfully
  const [uploadedMaterialIds, setUploadedMaterialIds] = useState([]); // Store uploaded material IDs

  // Decide whether to show suggestions:
  // 1) If navigation provided its own suggestion flag, always respect that.
  // 2) If file was uploaded successfully, treat as suggestion true
  // 3) Else if there are selectedIds, treat suggestion as true.
  // 4) Else fall back to the suggestion prop.
  const [effectiveSuggestion, setEffectiveSuggestion] = useState(() => {
    if (Object.prototype.hasOwnProperty.call(navState, "suggestion")) {
      return Boolean(navState.suggestion);
    }
    if (selectedIds.length > 0) {
      return true; // Show suggestions when there are selectedIds
    }
    return Boolean(suggestion);
  });

  const shouldShowAddBook = () => !effectiveSuggestion && selectedIds.length === 0 && !hasUploadedFile;

  const [recentBooks, setRecentBooks] = useState([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const fileInputRef = useRef(null);
  const hasFetchedRecentBooks = useRef(false);
  const lastSelectedIdsKey = useRef(null);

  // Handle PDF upload to backend
  const handleUploadPDF = async () => {
    if (!uploadedFile) {
      console.error('No file selected');
      return;
    }

    if (!formData.class_name || !formData.subject_name || !formData.chapter_name) {
      console.error('Missing form data');
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('access_token');

      // Create FormData for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('std', formData.class_name);
      uploadFormData.append('subject', formData.subject_name);
      uploadFormData.append('chapter_number', formData.chapter_name);
      uploadFormData.append('pdf_file', uploadedFile);

      console.log('Uploading PDF with data:', {
        std: formData.class_name,
        subject: formData.subject_name,
        chapter_number: formData.chapter_name,
        fileName: uploadedFile.name
      });

      const response = await axios.post(
        `${BACKEND_API_URL}/chapter-materials/upload`,
        uploadFormData,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type, let axios set it with boundary for FormData
          }
        }
      );

      if (response.status === 200) {
        handlesuccess(response?.data?.message || "Uploaded Successfully")
      }


      if (response.data && response.data.status) {
        console.log('PDF uploaded successfully!');

        // Extract material ID from response
        const materialId = response.data.data?.material?.id;
        if (materialId) {
          console.log('Saved material ID:', materialId);
          setUploadedMaterialIds([materialId]);
        }

        // Mark file as uploaded and set suggestion to true
        setHasUploadedFile(true);
        setEffectiveSuggestion(true);

        // Navigate to AddTopics page with material ID
        navigate("/chapter/AddTopics", {
          state: {
            materialIds: [materialId],
            form: formData
          }
        });
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setIsUploading(false);
      fetchRecentBooks();
    }
  };

  // Always fetch recent chapter materials on component mount
  const fetchRecentBooks = async () => {
    setIsLoadingBooks(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Fetching recent books...');
      const response = await axios.get(`${BACKEND_API_URL}/chapter-materials/recent`, {
        headers
      });

      console.log('Recent books API Response:', response.data);

      if (response.data && response.data.status && response.data.data && response.data.data.materials) {
        const materials = response.data.data.materials;

        console.log('Recent materials found:', materials.length);

        // Transform API data to match the UI structure
        const transformedBooks = materials.map((material) => ({
          id: material.id,
          title: material.file_name || "Untitled",
          author: `Class ${material.std} - ${material.subject}`,
          chapters: parseInt(material.chapter_number) || 0,
          filePath: material.file_path,
          fileSize: material.file_size,
          createdAt: material.created_at,
          std: material.std,
          subject: material.subject,
          sem: material.sem,
          board: material.board
        }));

        console.log('Transformed recent books:', transformedBooks);
        setRecentBooks(transformedBooks);
      }
    } catch (error) {
      console.error('Error fetching recent books:', error);
      setRecentBooks([]);
    } finally {
      setIsLoadingBooks(false);
    }
  };
  useEffect(() => {
    fetchRecentBooks();
  }, []);

  // Fetch selected chapters when selectedIds are passed
  useEffect(() => {
    if (!selectedIds || selectedIds.length === 0) {
      return;
    }

    const key = JSON.stringify(selectedIds);
    if (lastSelectedIdsKey.current === key) return;
    lastSelectedIdsKey.current = key;

    const fetchSelectedChapters = async () => {
      setIsLoadingBooks(true);
      try {
        const token = localStorage.getItem('access_token');
        const headers = {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('Fetching selected chapters with IDs:', selectedIds);
        const response = await axios.post(
          `${BACKEND_API_URL}/chapter-materials/select-multiple-chapters`,
          {
            selected_ids: selectedIds
          },
          { headers }
        );

        if (response.status === 200) {
          handlesuccess(response?.data?.message || "Successfully selected chapters")
        }


        if (response.data && response.data.status && response.data.data) {
          const materials = response.data.data.materials || response.data.data.chapters || [];

          const transformedBooks = materials.map((material) => ({
            id: material.id,
            title: material.file_name || material.chapter_name || "Untitled",
            author: `Class ${material.std} - ${material.subject}`,
            chapters: parseInt(material.chapter_number) || 0,
            filePath: material.file_path,
            fileSize: material.file_size,
            createdAt: material.created_at,
            std: material.std,
            subject: material.subject,
            sem: material.sem,
            board: material.board
          }));

          console.log('Transformed selected books:', transformedBooks);
          setRecentBooks(transformedBooks);
        }
      } catch (error) {
        console.error('Error fetching selected chapters:', error);
        setRecentBooks([]);
      } finally {
        setIsLoadingBooks(false);
      }
    };

    fetchSelectedChapters();
  }, [selectedIds]);


  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Future me yahi par API call karke chapter title/topics generate kar sakte ho
    setUploadedFile(file);

    // reset input so same file ko bhi dubara choose kar sake
    e.target.value = "";
  };

  return (
    <div
      className={`flex ${isDark ? "bg-black text-gray-100" : "bg-white text-zinc-900"
        } h-screen overflow-hidden transition-colors duration-300`}
    >
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main Section */}
      <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20">
          <Header title="Add Chapter Management" isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        {/* Scrollable content */}
        <main className="mt-4 sm:mt-6 flex-1 overflow-hidden">
          <div className="w-full mx-auto h-full flex flex-col space-y-4">
            {/* Toolbar row (sticky) */}
            <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} sticky top-0 z-30 border rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between backdrop-blur bg-opacity-90 shadow-sm`}>
              <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-base sm:text-lg font-medium`}>Upload Chapter</div>
              <div className="flex gap-2 w-[200px] justify-center items-center">
                <button
                  onClick={() => navigate(backto)}
                  className={`${isDark ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // If file is uploaded and suggestion is false, upload the PDF
                    if (uploadedFile && !effectiveSuggestion) {
                      handleUploadPDF();
                    } else {
                      // Navigate to AddTopics with selected IDs if available
                      navigate("/chapter/AddTopics", {
                        state: {
                          selectedIds: selectedIds,
                          form: formData
                        }
                      });
                    }
                  }}
                  disabled={isUploading}
                  className={`${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isUploading ? 'Uploading...' : 'Next'}
                </button>
              </div>
            </div>

            {/* Upload Chapter content panel */}
            <div
              className={`rounded-2xl mb-2 border shadow-sm px-5 sm:px-7 py-5 sm:py-6 transition-colors duration-300 ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                }`}
            >
              {/* Heading + description */}
              <div className="space-y-1 mb-5">
                <h2 className="text-lg sm:text-xl font-semibold">Upload Chapter</h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  Add a new chapter to your library with chapters
                </p>
              </div>

              {/* Hidden file input for chapter upload */}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Add Book button */}
              {shouldShowAddBook() && (
                <div className="mb-6 flex flex-col gap-2">
                  {!uploadedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                      className={`cursor-pointer inline-flex items-center justify-center gap-1 px-4 py-2 rounded-[10px] text-xs sm:text-sm font-medium transition-colors w-32 sm:w-36 ${isDark
                        ? "bg-zinc-800 text-gray-100 hover:bg-zinc-700"
                        : "bg-[#696CFF] text-white hover:bg-[#5a5de6]"
                        }`}
                    >
                      <span>Add Chapter</span>
                      <span>+</span>
                    </button>
                  )}

                  {uploadedFile && (
                    <div
                      className={`inline-flex items-center gap-2 max-w-sm rounded-full px-3.5 py-1.5 text-[11px] sm:text-xs border ${isDark
                        ? "bg-zinc-900/60 border-zinc-700 text-gray-100"
                        : "bg-zinc-50 border-zinc-300 text-zinc-800"
                        }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="truncate flex-1">
                        {uploadedFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUploadedFile(null)}
                        className={`cursor-pointer flex items-center justify-center w-5 h-5 rounded-full text-[10px] transition-colors shrink-0 ${isDark
                          ? "bg-zinc-800 text-gray-200 hover:bg-white hover:text-black"
                          : "bg-zinc-200 text-zinc-700 hover:bg-[#5a5de6] hover:text-white"
                          }`}
                        aria-label="Remove uploaded file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Recently added section */}
              <div className="space-y-3 flex flex-col">
                <div className="text-xs sm:text-sm text-gray-400">
                  Recently Added Chapters
                </div>

                <div className="space-y-2 pr-1 max-h-80 md:max-h-72 overflow-y-auto no-scrollbar">
                  {isLoadingBooks ? (
                    <div className={`rounded-md px-4 py-3 text-center text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-zinc-500"
                      }`}>
                      Loading recent Chapters...
                    </div>
                  ) : recentBooks.length === 0 ? (
                    <div className={`rounded-md px-4 py-3 text-center text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-zinc-500"
                      }`}>
                      No recent Chapters found
                    </div>
                  ) : (
                    recentBooks.map((book) => (
                      <div
                        key={book.id}
                        className={`rounded-md px-4 py-3 flex flex-col gap-1 text-xs sm:text-sm ${isDark
                          ? "bg-zinc-800 border border-zinc-700 text-gray-100"
                          : "bg-transparent border-0 text-zinc-900"
                          }`}
                      >
                        <div className="font-medium">
                          {book.title}
                        </div>
                        <div className="text-[11px] sm:text-xs text-gray-400">
                          {book.author} ( {book.chapters} Chapters )
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default UploadBook;
