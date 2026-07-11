import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const ElderlyProfiles = () => {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [language, setLanguage] = useState('English');
  const [address, setAddress] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [emergencyContacts, setEmergencyContacts] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Medical Vault States
  const [activeVaultProfile, setActiveVaultProfile] = useState(null);
  const [vaultDocs, setVaultDocs] = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultName, setVaultName] = useState('');
  const [vaultFile, setVaultFile] = useState(null);
  const [vaultFileBase64, setVaultFileBase64] = useState('');
  const [vaultUploadError, setVaultUploadError] = useState('');

  const fetchVaultDocs = async (elderlyId) => {
    setVaultLoading(true);
    try {
      const res = await axios.get(`/documents/elderly/${elderlyId}`);
      if (res.data.success) {
        setVaultDocs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVaultLoading(false);
    }
  };

  const handleOpenVault = (profile) => {
    setActiveVaultProfile(profile);
    setVaultName('');
    setVaultFile(null);
    setVaultFileBase64('');
    setVaultUploadError('');
    fetchVaultDocs(profile._id);
  };

  const handleCloseVault = () => {
    setActiveVaultProfile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setVaultUploadError('File size exceeds the 5MB limit.');
      return;
    }

    setVaultFile(file);
    setVaultUploadError('');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setVaultFileBase64(reader.result);
    };
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!vaultName || !vaultFile || !vaultFileBase64) {
      setVaultUploadError('Please select a file and enter a document name.');
      return;
    }

    try {
      setVaultLoading(true);
      const res = await axios.post('/documents/upload', {
        elderlyId: activeVaultProfile._id,
        name: vaultName,
        fileName: vaultFile.name,
        fileType: vaultFile.type,
        fileData: vaultFileBase64
      });

      if (res.data.success) {
        setVaultName('');
        setVaultFile(null);
        setVaultFileBase64('');
        fetchVaultDocs(activeVaultProfile._id);
      }
    } catch (err) {
      console.error(err);
      setVaultUploadError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setVaultLoading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      setVaultLoading(true);
      const res = await axios.delete(`/documents/${docId}`);
      if (res.data.success) {
        fetchVaultDocs(activeVaultProfile._id);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete document.');
    } finally {
      setVaultLoading(false);
    }
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/profiles');
      if (res.data.success) {
        setProfiles(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const resetForm = () => {
    setName('');
    setAge('');
    setGender('Male');
    setLanguage('English');
    setAddress('');
    setMedicalConditions('');
    setBloodGroup('A+');
    setEmergencyContacts('');
    setRelationship('');
    setPhoneNumber('');
    setPhoto('');
    setEditId(null);
    setError('');
  };

  const handleAddClick = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditClick = (profile) => {
    setEditId(profile._id);
    setName(profile.name);
    setAge(profile.age);
    setGender(profile.gender);
    setLanguage(profile.language);
    setAddress(profile.address || '');
    setMedicalConditions(profile.medicalConditions || '');
    setBloodGroup(profile.bloodGroup || 'A+');
    setEmergencyContacts(profile.emergencyContacts ? profile.emergencyContacts.join(', ') : '');
    setRelationship(profile.relationship);
    setPhoneNumber(profile.phoneNumber);
    setPhoto(profile.photo || '');
    setShowForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      const res = await axios.delete(`/profiles/${id}`);
      if (res.data.success) {
        setSuccess('Profile deleted successfully.');
        fetchProfiles();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete profile.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !age || !relationship || !phoneNumber) {
      setError('Please fill in Name, Age, Relationship, and Phone Number.');
      return;
    }

    const payload = {
      name,
      age: parseInt(age),
      gender,
      language,
      address,
      medicalConditions,
      bloodGroup,
      emergencyContacts,
      relationship,
      phoneNumber,
      preferredLanguage: language,
      photo: photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' // default avatar
    };

    try {
      let res;
      if (editId) {
        res = await axios.put(`/profiles/${editId}`, payload);
      } else {
        res = await axios.post('/profiles', payload);
      }

      if (res.data.success) {
        setSuccess(editId ? 'Profile updated successfully!' : 'Profile added successfully!');
        resetForm();
        setShowForm(false);
        fetchProfiles();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit profile.');
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1">{t('profiles')}</h1>
          <p className="text-muted mb-0">Register and manage profiles for remote wellness checks.</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary px-4 py-2" onClick={handleAddClick}>
            <i className="bi bi-plus-lg me-2"></i> {t('addProfile')}
          </button>
        )}
      </div>

      {success && (
        <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>{success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {showForm ? (
        <div className="card-custom p-4 bg-white mb-4">
          <h3 className="fw-bold border-bottom pb-3 mb-4">{editId ? t('editProfile') : t('addProfile')}</h3>
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Full Name */}
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-semibold">Full Name *</label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Age */}
              <div className="col-md-3 mb-3">
                <label className="form-label small fw-semibold">Age *</label>
                <input
                  type="number"
                  className="form-control form-control-custom"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>

              {/* Gender */}
              <div className="col-md-3 mb-3">
                <label className="form-label small fw-semibold">Gender *</label>
                <select
                  className="form-select form-control-custom"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="row">
              {/* Preferred Language */}
              <div className="col-md-4 mb-3">
                <label className="form-label small fw-semibold">{t('preferredLang')}</label>
                <select
                  className="form-select form-control-custom"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="English">English</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>

              {/* Blood Group */}
              <div className="col-md-4 mb-3">
                <label className="form-label small fw-semibold">{t('bloodGroup')}</label>
                <select
                  className="form-select form-control-custom"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              {/* Relationship */}
              <div className="col-md-4 mb-3">
                <label className="form-label small fw-semibold">Relationship to You * (e.g. Mother)</label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Father, Mother, Aunt"
                  required
                />
              </div>
            </div>

            <div className="row">
              {/* Phone Number */}
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-semibold">Contact Phone Number *</label>
                <input
                  type="tel"
                  className="form-control form-control-custom"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>

              {/* Photo Url */}
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-semibold">Photo Link/URL (Optional)</label>
                <input
                  type="url"
                  className="form-control form-control-custom"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="e.g. https://domain.com/photo.jpg"
                />
              </div>
            </div>

            {/* Address */}
            <div className="mb-3">
              <label className="form-label small fw-semibold">{t('address')}</label>
              <textarea
                className="form-control form-control-custom"
                rows="2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              ></textarea>
            </div>

            {/* Medical Conditions */}
            <div className="mb-3">
              <label className="form-label small fw-semibold">{t('medConditions')}</label>
              <textarea
                className="form-control form-control-custom"
                rows="2"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                placeholder="e.g. Diabetes, Hypertension, Heart Murmur"
              ></textarea>
            </div>

            {/* Emergency Contacts */}
            <div className="mb-4">
              <label className="form-label small fw-semibold">Emergency Contact Numbers (comma-separated)</label>
              <input
                type="text"
                className="form-control form-control-custom"
                value={emergencyContacts}
                onChange={(e) => setEmergencyContacts(e.target.value)}
                placeholder="e.g. +919999999999, +918888888888"
              />
            </div>

            {/* Buttons */}
            <div className="d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={() => setShowForm(false)}>
                {t('cancel')}
              </button>
              <button type="submit" className="btn btn-primary px-4 py-2">
                {t('save')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Profiles Grid */
        <div className="row g-4">
          {loading ? (
            [1, 2].map(i => (
              <div className="col-md-6" key={i}>
                <div className="card-custom bg-white p-4" style={{ height: '240px' }}>
                  <div className="skeleton mb-3" style={{ height: '60px', width: '60px', borderRadius: '50%' }}></div>
                  <div className="skeleton mb-2" style={{ height: '24px', width: '40%' }}></div>
                  <div className="skeleton mb-2" style={{ height: '16px', width: '70%' }}></div>
                  <div className="skeleton" style={{ height: '16px', width: '50%' }}></div>
                </div>
              </div>
            ))
          ) : profiles.length === 0 ? (
            <div className="col-12 text-center py-5">
              <i className="bi bi-people text-muted display-4 mb-3 d-block"></i>
              <p className="text-muted">No profiles found. Click the button above to add one.</p>
            </div>
          ) : (
            profiles.map((p) => (
              <div className="col-md-6" key={p._id}>
                <div className="card-custom bg-white p-4 h-100 position-relative">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <img 
                      src={p.photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'} 
                      alt={p.name}
                      className="rounded-circle border"
                      style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150';
                      }}
                    />
                    <div>
                      <h4 className="mb-1 fw-bold">{p.name}</h4>
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        <span className="badge bg-primary-subtle text-primary">{p.relationship}</span>
                        <span className="badge bg-secondary-subtle text-secondary">{p.age} years old</span>
                        <span className="badge bg-info-subtle text-info">{p.gender}</span>
                      </div>
                    </div>
                  </div>

                  <div className="row g-2 small border-top pt-3 mt-3">
                    <div className="col-6 mb-2">
                      <span className="text-muted d-block">{t('preferredLang')}:</span>
                      <strong className="text-dark">{p.preferredLanguage}</strong>
                    </div>
                    <div className="col-6 mb-2">
                      <span className="text-muted d-block">{t('bloodGroup')}:</span>
                      <strong className="text-dark">{p.bloodGroup || 'Not Specified'}</strong>
                    </div>
                    <div className="col-6 mb-2">
                      <span className="text-muted d-block">Contact:</span>
                      <strong className="text-dark">{p.phoneNumber}</strong>
                    </div>
                    <div className="col-6 mb-2">
                      <span className="text-muted d-block">Emergencies:</span>
                      <strong className="text-dark">{p.emergencyContacts?.join(', ') || 'None'}</strong>
                    </div>
                    <div className="col-12 mb-2">
                      <span className="text-muted d-block">{t('medConditions')}:</span>
                      <strong className="text-dark">{p.medicalConditions || 'None'}</strong>
                    </div>
                    <div className="col-12">
                      <span className="text-muted d-block">{t('address')}:</span>
                      <strong className="text-dark">{p.address || 'None'}</strong>
                    </div>
                  </div>

                  <div className="border-top pt-3 mt-3 d-flex justify-content-end">
                    <button className="btn btn-sm btn-outline-primary px-3 fw-semibold" onClick={() => handleOpenVault(p)}>
                      <i className="bi bi-file-earmark-medical me-1"></i> Medical Vault
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="position-absolute top-0 end-0 p-3 d-flex gap-1">
                    <button className="btn btn-sm btn-light border text-secondary" onClick={() => handleEditClick(p)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-light border text-danger" onClick={() => handleDeleteClick(p._id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Medical Document Locker Modal */}
      {activeVaultProfile && (
        <div className="modal show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header bg-light border-0 py-3 px-4">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center">
                  <i className="bi bi-vault me-2 text-primary fs-4"></i>
                  Medical Document Vault: {activeVaultProfile.name}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseVault}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                
                {/* Upload Form */}
                <form onSubmit={handleUploadDoc} className="card border-0 p-3 mb-4 shadow-sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
                  <h6 className="fw-bold mb-3 text-dark d-flex align-items-center">
                    <i className="bi bi-cloud-arrow-up-fill me-2 text-primary"></i> Upload New Health Document
                  </h6>
                  
                  {vaultUploadError && (
                    <div className="alert alert-danger py-2 mb-3 border-0 small">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>{vaultUploadError}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-5">
                      <label className="form-label small fw-semibold text-muted mb-1">Document Friendly Name</label>
                      <input 
                        type="text" 
                        className="form-control form-control-custom form-control-sm"
                        placeholder="e.g., Prescription July 2026"
                        value={vaultName}
                        onChange={(e) => setVaultName(e.target.value)}
                        required
                        style={{ height: '38px', borderRadius: '8px' }}
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label small fw-semibold text-muted mb-1">File (PDF, PNG, JPG - max 5MB)</label>
                      <input 
                        type="file" 
                        className="form-control form-control-custom form-control-sm"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        required
                        style={{ height: '38px', borderRadius: '8px', paddingTop: '6px' }}
                      />
                    </div>
                    <div className="col-md-2 d-flex align-items-end">
                      <button 
                        type="submit" 
                        className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center"
                        disabled={vaultLoading}
                        style={{ height: '38px', borderRadius: '8px' }}
                      >
                        {vaultLoading ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <>
                            <i className="bi bi-upload me-1"></i> Upload
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Documents list */}
                <h6 className="fw-bold mb-3 text-secondary d-flex align-items-center">
                  <i className="bi bi-folder2-open me-2"></i> Stored Documents ({vaultDocs.length})
                </h6>
                {vaultLoading && vaultDocs.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary spinner-border-sm"></div>
                  </div>
                ) : vaultDocs.length === 0 ? (
                  <div className="text-center py-5 mb-0 bg-light rounded" style={{ borderRadius: '12px' }}>
                    <i className="bi bi-file-earmark-medical text-muted display-6 mb-2 d-block"></i>
                    <p className="text-muted small mb-0">No documents in the vault yet.</p>
                  </div>
                ) : (
                  <div className="list-group border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    {vaultDocs.map((doc) => {
                      const isPdf = doc.fileType.includes('pdf');
                      const fileIcon = isPdf ? 'bi-file-earmark-pdf-fill text-danger' : 'bi-file-earmark-image-fill text-success';
                      return (
                        <div key={doc._id} className="list-group-item d-flex justify-content-between align-items-center border-0 border-bottom py-3 px-3" style={{ backgroundColor: '#fff' }}>
                          <div className="d-flex align-items-center gap-3">
                            <div className="p-2 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                              <i className={`bi ${fileIcon} fs-4`}></i>
                            </div>
                            <div>
                              <strong className="d-block text-dark">{doc.name}</strong>
                              <small className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>{doc.fileName.substring(13)}</small>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <a 
                              href={`http://localhost:5000/uploads/documents/${doc.fileName}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              download
                              className="btn btn-sm btn-light border text-primary"
                              title="Download Document"
                              style={{ borderRadius: '6px' }}
                            >
                              <i className="bi bi-download"></i>
                            </a>
                            <button 
                              className="btn btn-sm btn-light border text-danger" 
                              onClick={() => handleDeleteDoc(doc._id)}
                              title="Delete Document"
                              style={{ borderRadius: '6px' }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light border-0 py-3 px-4">
                <button type="button" className="btn btn-secondary px-4 fw-semibold" onClick={handleCloseVault} style={{ borderRadius: '8px' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElderlyProfiles;
