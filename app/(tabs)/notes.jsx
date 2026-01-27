import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as DocumentPicker from 'expo-document-picker';
import { db, storage, auth } from './firebase';

// DEPARTMENTS DATA
const DEPARTMENTS = [
  'Computer Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
  'Chemical Engineering',
  'Architecture',
  'Electrical Engineering',
  'Electronics & Communication',
  'Aerospace Engineering',
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SUBJECTS = ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4', 'Subject 5', 'Subject 6'];

export default function Notes() {
  // Navigation State
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' or 'labReports'

  // Upload Modal State
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [uploadType, setUploadType] = useState(null); // 'pdf' or 'link'
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadLink, setUploadLink] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Data State
  const [notesData, setNotesData] = useState([]);
  const [labReportsData, setLabReportsData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data when subject/tab changes
  useEffect(() => {
    if (selectedSubject) {
      fetchData();
    }
  }, [selectedSubject, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const collectionPath = `notes/${selectedDepartment}/sem${selectedSemester}/${selectedSubject}/${activeTab}`;
      const q = query(collection(db, collectionPath), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (activeTab === 'notes') {
        setNotesData(data);
      } else {
        setLabReportsData(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === 'ioecampus') {
      setPasswordVerified(true);
      setPasswordInput('');
    } else {
      Alert.alert('Wrong Password', 'Access denied');
      setPasswordInput('');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setSelectedFile(result);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleUpload = async () => {
    if (!uploadTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (uploadType === 'link' && !uploadLink.trim()) {
      Alert.alert('Error', 'Please enter a link');
      return;
    }

    if (uploadType === 'pdf' && !selectedFile) {
      Alert.alert('Error', 'Please select a PDF file');
      return;
    }

    setUploading(true);

    try {
      const collectionPath = `notes/${selectedDepartment}/sem${selectedSemester}/${selectedSubject}/${activeTab}`;
      
      let uploadData = {
        title: uploadTitle,
        type: uploadType,
        timestamp: new Date(),
        // TODO: Add uploader info - Replace 'anonymous' with auth.currentUser.uid or displayName
        uploadedBy: 'anonymous',
      };

      if (uploadType === 'link') {
        uploadData.url = uploadLink;
      } else {
        // Upload PDF to Firebase Storage
        const storageRef = ref(
          storage,
          `notes/${selectedDepartment}/sem${selectedSemester}/${selectedSubject}/${activeTab}/${Date.now()}_${selectedFile.name}`
        );
        
        const response = await fetch(selectedFile.uri);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        
        uploadData.fileUrl = downloadURL;
        uploadData.fileName = selectedFile.name;
      }

      await addDoc(collection(db, collectionPath), uploadData);
      
      Alert.alert('Success', 'Uploaded successfully!');
      resetUploadModal();
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Error uploading:', error);
      Alert.alert('Error', 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadModal = () => {
    setUploadModalVisible(false);
    setPasswordVerified(false);
    setUploadType(null);
    setUploadTitle('');
    setUploadLink('');
    setSelectedFile(null);
    setPasswordInput('');
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open link'));
  };

  const renderDepartmentSelector = () => (
    <View style={styles.container}>
      <Text style={styles.header}>SELECT DEPARTMENT</Text>
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {DEPARTMENTS.map((dept, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => setSelectedDepartment(dept)}
          >
            <Text style={styles.cardText}>{dept}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSemesterSelector = () => (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setSelectedDepartment(null)} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.header}>{selectedDepartment}</Text>
      <Text style={styles.subHeader}>SELECT SEMESTER</Text>
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {SEMESTERS.map((sem) => (
          <TouchableOpacity
            key={sem}
            style={styles.card}
            onPress={() => setSelectedSemester(sem)}
          >
            <Text style={styles.cardText}>SEMESTER {sem}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSubjectSelector = () => (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setSelectedSemester(null)} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.header}>SEMESTER {selectedSemester}</Text>
      <Text style={styles.subHeader}>SELECT SUBJECT</Text>
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {SUBJECTS.map((subject, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => setSelectedSubject(subject)}
          >
            <Text style={styles.cardText}>{subject}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSubjectView = () => {
    const currentData = activeTab === 'notes' ? notesData : labReportsData;

    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setSelectedSubject(null)} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.header}>{selectedSubject}</Text>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'notes' && styles.activeTab]}
            onPress={() => setActiveTab('notes')}
          >
            <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>
              NOTES
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'labReports' && styles.activeTab]}
            onPress={() => setActiveTab('labReports')}
          >
            <Text style={[styles.tabText, activeTab === 'labReports' && styles.activeTabText]}>
              LAB REPORTS
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setUploadModalVisible(true)}
        >
          <Text style={styles.uploadButtonText}>+ UPLOAD</Text>
        </TouchableOpacity>

        {/* Content List */}
        {loading ? (
          <ActivityIndicator size="large" color="#E10600" style={{ marginTop: 50 }} />
        ) : (
          <ScrollView style={styles.contentList}>
            {currentData.length === 0 ? (
              <Text style={styles.emptyText}>No {activeTab === 'notes' ? 'notes' : 'lab reports'} yet. Be the first to upload!</Text>
            ) : (
              currentData.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.contentCard}
                  onPress={() => item.type === 'link' ? openLink(item.url) : openLink(item.fileUrl)}
                >
                  <Text style={styles.contentTitle}>{item.title}</Text>
                  <Text style={styles.contentMeta}>
                    {item.type === 'pdf' ? '📄 PDF' : '🔗 Link'} • {item.uploadedBy}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderUploadModal = () => (
    <Modal visible={uploadModalVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {!passwordVerified ? (
            <>
              <Text style={styles.modalTitle}>ENTER PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#666"
                secureTextEntry
                value={passwordInput}
                onChangeText={setPasswordInput}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={resetUploadModal}>
                  <Text style={styles.cancelButtonText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handlePasswordSubmit}>
                  <Text style={styles.submitButtonText}>SUBMIT</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : !uploadType ? (
            <>
              <Text style={styles.modalTitle}>SELECT UPLOAD TYPE</Text>
              <TouchableOpacity
                style={styles.typeButton}
                onPress={() => setUploadType('pdf')}
              >
                <Text style={styles.typeButtonText}>📄 UPLOAD PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.typeButton}
                onPress={() => setUploadType('link')}
              >
                <Text style={styles.typeButtonText}>🔗 ADD LINK</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={resetUploadModal}>
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.modalTitle}>
                {uploadType === 'pdf' ? 'UPLOAD PDF' : 'ADD LINK'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor="#666"
                value={uploadTitle}
                onChangeText={setUploadTitle}
              />
              {uploadType === 'link' ? (
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com"
                  placeholderTextColor="#666"
                  value={uploadLink}
                  onChangeText={setUploadLink}
                  autoCapitalize="none"
                />
              ) : (
                <>
                  <TouchableOpacity style={styles.filePickerButton} onPress={pickDocument}>
                    <Text style={styles.filePickerText}>
                      {selectedFile ? selectedFile.name : 'SELECT PDF FILE'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {uploading ? (
                <ActivityIndicator size="large" color="#E10600" style={{ marginTop: 20 }} />
              ) : (
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={resetUploadModal}>
                    <Text style={styles.cancelButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitButton} onPress={handleUpload}>
                    <Text style={styles.submitButtonText}>UPLOAD</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Main render logic
  if (!selectedDepartment) return renderDepartmentSelector();
  if (!selectedSemester) return renderSemesterSelector();
  if (!selectedSubject) return renderSubjectSelector();
  return (
    <>
      {renderSubjectView()}
      {renderUploadModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0E',
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subHeader: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#E10600',
    fontSize: 16,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#1A1A1A',
    width: '48%',
    padding: 20,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E10600',
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#E10600',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  uploadButton: {
    backgroundColor: '#E10600',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  contentList: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E10600',
  },
  contentTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  contentMeta: {
    color: '#999',
    fontSize: 12,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    width: '85%',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#0E0E0E',
    color: '#FFFFFF',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#E10600',
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  typeButton: {
    backgroundColor: '#E10600',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  typeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filePickerButton: {
    backgroundColor: '#0E0E0E',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E10600',
    marginBottom: 16,
    alignItems: 'center',
  },
  filePickerText: {
    color: '#E10600',
    fontSize: 14,
    fontWeight: '600',
  },
});