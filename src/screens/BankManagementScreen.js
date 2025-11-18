import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/apiService';

const { width, height } = Dimensions.get('window');

const BankManagementScreen = ({ navigation, route }) => {
  const { userInfo } = route.params || {};
  const [banks, setBanks] = useState([]);
  const [masterBanks, setMasterBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [formData, setFormData] = useState({
    account_number: '',
    account_name: '',
    ifsc_code: '',
    bank_name: '',
    bank_id: ''
  });
  const [selectedBank, setSelectedBank] = useState(null);
  const [ifscValidating, setIfscValidating] = useState(false);

  useEffect(() => {
    loadBanks();
    loadMasterBanks();
  }, []);

  const loadBanks = async () => {
    try {
      setLoading(true);
      const response = await ApiService.makeRequest('/users/banks/list.php?test_mode=1&unique_id=8367070701');
      
      if (response.success && response.data && response.data.bank_accounts) {
        setBanks(response.data.bank_accounts);
      } else {
        setBanks([]);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
      setBanks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterBanks = async () => {
    try {
      const response = await ApiService.makeRequest('/banks/comprehensive-list.php');
      if (response.success && response.data && response.data.banks) {
        setMasterBanks(response.data.banks);
      }
    } catch (error) {
      console.error('Error loading master banks:', error);
    }
  };

  const validateIFSC = async (ifscCode) => {
    if (!ifscCode || ifscCode.length < 11) return;
    
    try {
      setIfscValidating(true);
      const response = await ApiService.makeRequest(`/banks/validate-ifsc.php?ifsc=${ifscCode}`);
      
      if (response.success && response.data) {
        setFormData(prev => ({
          ...prev,
          bank_name: response.data.bank_name,
          bank_id: response.data.bank_code
        }));
        setSelectedBank({
          bank_id: response.data.bank_code,
          bank_name: response.data.bank_name
        });
      } else {
        Alert.alert('Invalid IFSC', 'Please enter a valid IFSC code');
        setFormData(prev => ({
          ...prev,
          bank_name: '',
          bank_id: ''
        }));
        setSelectedBank(null);
      }
    } catch (error) {
      console.error('Error validating IFSC:', error);
      Alert.alert('Error', 'Failed to validate IFSC code');
    } finally {
      setIfscValidating(false);
    }
  };

  const handleAddBank = async () => {
    try {
      if (!formData.account_number || !formData.account_name || !formData.ifsc_code || !formData.bank_name) {
        Alert.alert('Error', 'Please fill all fields');
        return;
      }

      const response = await ApiService.makeRequest('/users/banks/add.php', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (response.success) {
        Alert.alert('Success', 'Bank account added successfully');
        setShowAddModal(false);
        setFormData({ account_number: '', account_name: '', ifsc_code: '', bank_name: '' });
        loadBanks();
      } else {
        Alert.alert('Error', response.message || 'Failed to add bank account');
      }
    } catch (error) {
      console.error('Error adding bank:', error);
      Alert.alert('Error', 'Failed to add bank account');
    }
  };

  const handleEditBank = async () => {
    try {
      if (!formData.account_number || !formData.account_name || !formData.ifsc_code || !formData.bank_name) {
        Alert.alert('Error', 'Please fill all fields');
        return;
      }

      const response = await ApiService.makeRequest('/users/banks/update.php', {
        method: 'PUT',
        body: JSON.stringify({
          bank_id: editingBank.id,
          ...formData
        }),
      });

      if (response.success) {
        Alert.alert('Success', 'Bank account updated successfully');
        setShowEditModal(false);
        setEditingBank(null);
        setFormData({ account_number: '', account_name: '', ifsc_code: '', bank_name: '' });
        loadBanks();
      } else {
        Alert.alert('Error', response.message || 'Failed to update bank account');
      }
    } catch (error) {
      console.error('Error updating bank:', error);
      Alert.alert('Error', 'Failed to update bank account');
    }
  };

  const handleDeleteBank = (bank) => {
    Alert.alert(
      'Delete Bank Account',
      `Are you sure you want to delete ${bank.bank_name} - ${bank.account_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.makeRequest(`/users/banks/delete.php?bank_id=${bank.id}`, {
                method: 'DELETE',
              });

              if (response.success) {
                Alert.alert('Success', 'Bank account deleted successfully');
                loadBanks();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete bank account');
              }
            } catch (error) {
              console.error('Error deleting bank:', error);
              Alert.alert('Error', 'Failed to delete bank account');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (bank) => {
    setEditingBank(bank);
    setFormData({
      account_number: bank.account_number,
      account_name: bank.account_name,
      ifsc_code: bank.ifsc_code,
      bank_name: bank.bank_name
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({ account_number: '', account_name: '', ifsc_code: '', bank_name: '', bank_id: '' });
    setEditingBank(null);
    setSelectedBank(null);
  };

  const BankForm = ({ isEdit = false }) => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>{isEdit ? 'Edit Bank Account' : 'Add Bank Account'}</Text>
      
      {/* Bank Selection */}
      <View style={styles.bankSelectionContainer}>
        <Text style={styles.label}>Select Bank</Text>
        
        {/* Popular Banks */}
        <View style={styles.bankCategoryContainer}>
          <Text style={styles.categoryLabel}>Popular Banks</Text>
          <ScrollView style={styles.bankList} horizontal showsHorizontalScrollIndicator={false}>
            {masterBanks.filter(bank => bank.popular).map((bank) => (
              <TouchableOpacity
                key={bank.bank_id}
                style={[
                  styles.bankOption,
                  selectedBank?.bank_id === bank.bank_id && styles.bankOptionSelected
                ]}
                onPress={() => {
                  setSelectedBank(bank);
                  setFormData(prev => ({
                    ...prev,
                    bank_name: bank.bank_name,
                    bank_id: bank.bank_id
                  }));
                }}
              >
                <Text style={[
                  styles.bankOptionText,
                  selectedBank?.bank_id === bank.bank_id && styles.bankOptionTextSelected
                ]}>
                  {bank.bank_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* All Banks - Show as dropdown style */}
        <View style={styles.bankCategoryContainer}>
          <Text style={styles.categoryLabel}>All Banks</Text>
          <View style={styles.bankDropdownContainer}>
            <ScrollView style={styles.bankDropdown} showsVerticalScrollIndicator={false}>
              {masterBanks.map((bank) => (
                <TouchableOpacity
                  key={bank.bank_id}
                  style={[
                    styles.bankDropdownOption,
                    selectedBank?.bank_id === bank.bank_id && styles.bankDropdownOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedBank(bank);
                    setFormData(prev => ({
                      ...prev,
                      bank_name: bank.bank_name,
                      bank_id: bank.bank_id
                    }));
                  }}
                >
                  <Text style={[
                    styles.bankDropdownOptionText,
                    selectedBank?.bank_id === bank.bank_id && styles.bankDropdownOptionTextSelected
                  ]}>
                    {bank.bank_name}
                  </Text>
                  {selectedBank?.bank_id === bank.bank_id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
      
      {/* Selected Bank Display */}
      {selectedBank && (
        <View style={styles.selectedBankContainer}>
          <Text style={styles.selectedBankText}>Selected: {selectedBank.bank_name}</Text>
        </View>
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Account Holder Name"
        value={formData.account_name}
        onChangeText={(text) => setFormData({ ...formData, account_name: text })}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Account Number"
        value={formData.account_number}
        onChangeText={(text) => setFormData({ ...formData, account_number: text })}
        keyboardType="numeric"
      />
      
      <View style={styles.ifscContainer}>
        <TextInput
          style={[styles.input, styles.ifscInput]}
          placeholder="IFSC Code (e.g., SBIN0001234)"
          value={formData.ifsc_code}
          onChangeText={(text) => {
            const upperText = text.toUpperCase();
            setFormData({ ...formData, ifsc_code: upperText });
            if (upperText.length === 11) {
              validateIFSC(upperText);
            }
          }}
          autoCapitalize="characters"
          maxLength={11}
        />
        {ifscValidating && (
          <View style={styles.validatingIndicator}>
            <Text style={styles.validatingText}>Validating...</Text>
          </View>
        )}
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => {
            if (isEdit) {
              setShowEditModal(false);
            } else {
              setShowAddModal(false);
            }
            resetForm();
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={isEdit ? handleEditBank : handleAddBank}
        >
          <Text style={styles.saveButtonText}>{isEdit ? 'Update' : 'Add'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading banks...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Banks</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {banks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Bank Accounts</Text>
            <Text style={styles.emptyText}>Add your first bank account to start selling gold</Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addFirstButtonText}>Add Bank Account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          banks.map((bank, index) => (
            <View key={bank.id || index} style={styles.bankCard}>
              <View style={styles.bankInfo}>
                <Text style={styles.bankName}>{bank.bank_name}</Text>
                <Text style={styles.accountName}>{bank.account_name}</Text>
                <Text style={styles.accountNumber}>****{bank.account_number.slice(-4)}</Text>
                <Text style={styles.ifscCode}>{bank.ifsc_code}</Text>
              </View>
              <View style={styles.bankActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(bank)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteBank(bank)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Bank Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <BankForm isEdit={false} />
          </View>
        </View>
      </Modal>

      {/* Edit Bank Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <BankForm isEdit={true} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: 5,
  },
  addButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  addFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bankCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bankInfo: {
    marginBottom: 15,
  },
  bankName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  accountName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  accountNumber: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  ifscCode: {
    fontSize: 14,
    color: '#999',
  },
  bankActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  formContainer: {
    width: '100%',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  bankSelectionContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  bankCategoryContainer: {
    marginBottom: 15,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  bankList: {
    maxHeight: 120,
  },
  bankOption: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bankOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  bankOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  bankOptionTextSelected: {
    color: '#fff',
  },
  selectedBankContainer: {
    backgroundColor: '#e8f4fd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  selectedBankText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  ifscContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  ifscInput: {
    paddingRight: 100,
  },
  validatingIndicator: {
    position: 'absolute',
    right: 10,
    top: 15,
  },
  validatingText: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  bankDropdownContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    maxHeight: 150,
  },
  bankDropdown: {
    maxHeight: 150,
  },
  bankDropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bankDropdownOptionSelected: {
    backgroundColor: '#e8f4fd',
  },
  bankDropdownOptionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  bankDropdownOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default BankManagementScreen;