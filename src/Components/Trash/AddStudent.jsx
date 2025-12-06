import React, { useMemo, useState, useEffect } from 'react'
import Sidebar from '../../Tools/Sidebar'
import Header from '../../Tools/Header'
import { UploadCloud } from 'lucide-react'
import { handlesuccess, handleerror, BACKEND_API_URL } from '../../../utils/assets'
import axios from 'axios'
import { NavLink, useNavigate, useParams } from 'react-router-dom'

function AddStudent({ theme, isDark, toggleTheme, sidebardata, title = 'Add Student' }) {
  const resolvedDark = typeof isDark === 'boolean' ? isDark : theme === 'dark'
  const [form, setForm] = useState({
    name: '',
    father_name: '',
    enrollment_number: '',
    password: '',
    class_name: '',
    division: '',
    subject: '',
    mobile_number: '',
  })
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const localTitle = isEdit ? 'Edit Student' : title

  const containerCls = useMemo(() => (
    `w-full rounded-xl shadow-lg p-6 space-y-6 ${resolvedDark ? 'bg-zinc-900 text-gray-200 border border-zinc-800' : 'bg-white text-zinc-800 border border-zinc-200'}`
  ), [resolvedDark])

  const inputCls = `w-full rounded-lg px-3 bg-zinc-800 py-2.5 text-[13px] md:text-sm focus:outline-none focus:ring-2 border ${resolvedDark ? 'bg-[#1A1A1A] border-zinc-700 text-gray-200 placeholder:text-gray-400 focus:ring-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-[#696CFF]/30'}`;

  useEffect(() => {
    if (!isEdit) return
    const fetchStudent = async () => {
      try {
        const res = await axios.get(`${BACKEND_API_URL}/studentm/get_student/${id}`)
        const payload = res?.data || {}
        const d = payload?.data || payload?.student || payload
        setForm({
          name: d?.name || '',
          father_name: d?.father_name || '',
          enrollment_number: d?.enrollment_number || '',
          password: '',
          class_name: d?.class_name || '',
          division: d?.division || '',
          subject: d?.subject || '',
          mobile_number: d?.mobile_number || '',
        })
        if (d?.photo_url) {
          let url = d.photo_url
          const isAbsolute = /^(https?:)?\/\//.test(url) || url.startsWith('blob:') || url.startsWith('data:')
          if (!isAbsolute) {
            url = `${BACKEND_API_URL}${url}`
          }
          setPreview(url)
        }
      } catch (err) {
        handleerror(err?.response?.data?.message || err?.message || 'Failed to load student')
      }
    }
    fetchStudent()
  }, [isEdit, id])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onPickPhoto = (file) => {
    if (!file) return
    setPhoto(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  const onDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) onPickPhoto(file)
  }

  const onBrowse = (e) => {
    const file = e.target.files?.[0]
    if (file) onPickPhoto(file)
  }

  const onSave = async () => {
    if (!form.name || !form.enrollment_number) {
      handleerror('Name and Enrollment Number are required')
      return
    }
    try {
      setSaving(true)

      // Create FormData for multipart/form-data request
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('enrollment_number', form.enrollment_number)
      formData.append('password', form.password || '')
      formData.append('class_name', form.class_name || '')
      formData.append('division', form.division || '')
      formData.append('subject', form.subject || '')
      formData.append('father_name', form.father_name || '')
      formData.append('mobile_number', form.mobile_number || '')

      // Add photo file if exists
      if (photo) {
        formData.append('file', photo)
      }

      // Call API
      let response
      if (isEdit) {
        response = await axios.put(`${BACKEND_API_URL}/studentm/edit_student/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        response = await axios.post(`${BACKEND_API_URL}/studentm/create_student`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      handlesuccess(response.data?.message || (isEdit ? 'Student updated successfully' : 'Student created successfully'))

      // Reset form
      setForm({ name: '', father_name: '', enrollment_number: '', password: '', class_name: '', division: '', subject: '', mobile_number: '' })
      setPhoto(null)
      setPreview('')

      //navigate to students list
      setTimeout(() => {
        navigate('/Student/list')
      }, 2000);

      // Clear file input
      const fileInput = document.getElementById('student-photo-input')
      if (fileInput) fileInput.value = ''
    } catch (error) {
      console.error('Error creating student:', error)
      handleerror(error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to create student')
    } finally {
      setSaving(false)
    }
  }

  const onCancel = () => {
    setForm({ name: '', father_name: '', enrollment_number: '', password: '', class_name: '', division: '', subject: '', mobile_number: '' })
    setPhoto(null)
    setPreview('')
    // Clear file input
    const fileInput = document.getElementById('student-photo-input')
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className={`flex ${resolvedDark ? 'bg-zinc-950 text-gray-100' : 'bg-zinc-50 text-zinc-900'} h-screen transition-colors duration-300`}>
      <Sidebar isDark={resolvedDark} sidebardata={sidebardata} />
      <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full md:ml-[60px] lg:ml-72 p-7 transition-all duration-300`}>
        <div className="sticky top-0 z-20">
          <Header title={localTitle} isDark={resolvedDark} toggleTheme={toggleTheme} />
        </div>

        <main className={`mt-6 gap-6 flex-1 min-h-0 overflow-hidden ${resolvedDark ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
          <div className={`${containerCls} flex flex-col overflow-hidden flex-1 min-h-0`}>
            <div className={`flex items-center justify-between pb-2 m-0 shrink-0 ${resolvedDark ? 'border-b border-zinc-800' : 'border-b border-zinc-200'}`}>
              <div className={`text-sm font-semibold ${resolvedDark ? 'text-gray-200' : 'text-[#696CFF]'}`}>Student List</div>
              {/* Top actions: desktop/tablet only */}
              <div className="hidden md:flex items-center gap-2 min-w-[200px]">
                <NavLink
                  to="/student/list"
                  onClick={onCancel}
                  className={`${resolvedDark ? 'bg-transparent text-gray-300 hover:bg-zinc-800 border border-zinc-700' : 'bg-white text-zinc-800 hover:bg-gray-100 border border-zinc-300'} inline-flex items-center justify-center rounded-md px-4 py-1.5 text-sm shadow-sm w-full`}
                >
                  Cancel
                </NavLink>
                <button
                  disabled={saving}
                  onClick={onSave}
                  className={`${resolvedDark ? 'bg-[#696CFF] text-white hover:opacity-90' : 'bg-[#696CFF] text-white hover:bg-[#575BFF]'} rounded-md px-4 py-1.5 text-sm font-semibold shadow-sm disabled:opacity-60 w-full`}
                >
                  {saving ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update' : 'Save')}
                </button>
              </div>
            </div>

            <div className="space-y-6 flex-1 min-h-0 overflow-y-auto no-scrollbar max-h-[calc(100vh-260px)]">
              <div>
                <div className={`${resolvedDark ? 'text-gray-200' : 'text-[#696CFF]'} text-sm font-semibold mb-2 mt-4 `}>Upload Student Photo</div>
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  className={`${resolvedDark ? 'bg-[#111214] border-[#696CFF] text-gray-300' : 'bg-white border-[#696CFF] text-zinc-600'} bg-zinc-800 border-2 border-dashed rounded-xl w-full flex flex-col items-center justify-center h-44 cursor-pointer transition-colors`}
                >
                  <input type="file" id="student-photo-input" accept="image/*" className="hidden" onChange={onBrowse} />
                  {preview ? (
                    <img src={preview} alt="preview" className="h-40 object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <UploadCloud size={22} className="opacity-90 text-[#696CFF]" />
                      <div className={`text-[13px] ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>
                        <span className={'text-[#696CFF]'}>Click to upload
                        </span>
                        &nbsp; or drag and drop
                      </div>
                      <div className="text-xs opacity-70">PNG, JPG</div>
                    </div>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-[13px] md:text-sm mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Name</label>
                  <input name="name" value={form.name} onChange={onChange} placeholder="Enter Name" className={inputCls} />
                </div>
                <div>
                  <label className={`block text-[13px] md:text-sm mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Father Name</label>
                  <input name="father_name" value={form.father_name} onChange={onChange} placeholder="Enter Your Father Name" className={inputCls} />
                </div>
                <div>
                  <label className={`block text-[13px] md:text-sm mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Enrollment Number</label>
                  <input name="enrollment_number" value={form.enrollment_number} onChange={onChange} placeholder="Enter Enrollment Number" className={inputCls} />
                </div>
                <div>
                  <label className={`block text-[13px] md:text-sm mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Password</label>
                  <input type="password" name="password" value={form.password} onChange={onChange} placeholder="Enter Password" className={inputCls} />
                </div>
                <div>
                  <label className={`block text-[13px] md:text-sm mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Class</label>
                  <input name="class_name" value={form.class_name} onChange={onChange} placeholder="Enter Class" className={inputCls} />
                </div>
                <div>
                  <label className={`block text-[13px] md:text-sm mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Division</label>
                  <input name="division" value={form.division} onChange={onChange} placeholder="Enter Division" className={inputCls} />
                </div>
                <div>
                  <label className={`block text-[13px] md:text-sm mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Subject</label>
                  <input name="subject" value={form.subject} onChange={onChange} placeholder="Enter Subject" className={inputCls} />
                </div>
                <div>
                  <label className={`block text-[13px] md:text-sm mb-2 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Mobile Number</label>
                  <input name="mobile_number" value={form.mobile_number} onChange={onChange} placeholder="Enter Your Number" className={inputCls} />
                </div>
              </div>

              {/* Mobile-only bottom actions */}
              <div className="flex md:hidden flex-row items-stretch gap-3 pt-2">
                <button onClick={onCancel} className={`${resolvedDark ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-800 hover:bg-gray-100 border border-zinc-300'} rounded-md px-4 py-2 text-sm w-full shadow-sm`}>
                  Cancel
                </button>
                <button disabled={saving} onClick={onSave} className={`${resolvedDark ? 'bg-[#696CFF] text-white hover:opacity-90' : 'bg-[#696CFF] text-white hover:bg-[#575BFF]'} rounded-md px-4 py-2 text-sm font-semibold w-full shadow-sm disabled:opacity-60`}>
                  {saving ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update' : 'Save')}
                </button>
              </div>
            </div>
          </div>


        </main>
      </div>
    </div>
  )
}

export default AddStudent
