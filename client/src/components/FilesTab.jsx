import React, { useState, useEffect } from 'react';
import api from '../api';

export default function FilesTab({ socket, roomId, currentUser }) {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  // Load existing files in room
  useEffect(() => {
    let active = true;
    async function fetchFiles() {
      try {
        const res = await api.get(`/rooms/${roomId}/files`);
        if (active) {
          setFiles(res.data);
        }
      } catch (err) {
        console.error('Failed to load files:', err);
      }
    }
    fetchFiles();

    return () => {
      active = false;
    };
  }, [roomId]);

  // Listen to real-time file sharing from other participants
  useEffect(() => {
    if (!socket) return;

    const handleFileShared = (newFile) => {
      setFiles((prev) => [newFile, ...prev]);
    };

    socket.on('file-shared', handleFileShared);

    return () => {
      socket.off('file-shared', handleFileShared);
    };
  }, [socket]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File exceeds 10MB limit.');
      return;
    }

    setErrorMsg('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post(`/rooms/${roomId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedFile = res.data;
      setFiles((prev) => [uploadedFile, ...prev]);

      // Broadcast to other room members
      if (socket) {
        socket.emit('file-shared', {
          roomId,
          file: uploadedFile
        });
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (file) => {
    setDownloadingId(file._id);
    try {
      const response = await api.get(`/files/${file._id}/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: file.mimeType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download decrypted file.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="files-tab">
      <div className="file-upload-box">
        <label className="btn btn-primary file-select-label">
          {isUploading ? 'Encrypting & Uploading...' : '📁 Choose File (Max 10MB)'}
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </label>
        {errorMsg && <p className="error-text">{errorMsg}</p>}
        <small className="file-enc-note">🔒 Files are encrypted with AES-256-GCM at rest.</small>
      </div>

      <div className="files-list">
        {files.length === 0 ? (
          <div className="files-empty">No files shared yet in this room.</div>
        ) : (
          files.map((file) => (
            <div key={file._id} className="file-card">
              <div className="file-info">
                <span className="file-name" title={file.originalName}>
                  {file.originalName}
                </span>
                <span className="file-meta">
                  {formatFileSize(file.size)} • Uploaded by{' '}
                  {file.uploadedBy?.name || 'User'}
                </span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownload(file)}
                disabled={downloadingId === file._id}
              >
                {downloadingId === file._id ? 'Decrypting...' : '⬇️ Download'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

