import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Animated,
  StatusBar,
  SafeAreaView,
  RefreshControl,
  TextInput,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import ApiService from '../services/apiService';

const TransactionHistoryScreen = ({ navigation, route }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [usingRealData, setUsingRealData] = useState(false);
  const [dataStatus, setDataStatus] = useState('loading');
  const [lastUpdated, setLastUpdated] = useState(null);

  const filters = [
    { key: 'all', label: 'All', icon: '📋' },
    { key: 'buy', label: 'Buy', icon: '💰' },
    { key: 'sell', label: 'Sell', icon: '💸' },
    { key: 'sip', label: 'SIP', icon: '📈' },
  ];

  useEffect(() => {
    loadTransactions();
    
    // Start animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Refresh transactions when screen comes into focus (e.g., after payment)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 Transaction history screen focused - refreshing data');
      loadTransactions();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery]);

  useEffect(() => {
    // Reload transactions when filter changes
    loadTransactions();
  }, [selectedFilter]);

  const loadTransactions = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setOffset(0);
      }

      const currentOffset = loadMore ? offset : 0;
      console.log('🔄 Loading transactions:', { type: selectedFilter, limit: 20, offset: currentOffset });
      
      const response = await ApiService.getTransactions(selectedFilter, 20, currentOffset);
      
      if (response.success && response.data) {
        const newTransactions = response.data.transactions || [];
        console.log('✅ Transactions loaded:', newTransactions.length, 'transactions');
        
        if (loadMore) {
          setTransactions(prev => [...prev, ...newTransactions]);
        } else {
          setTransactions(newTransactions);
        }
        
        setHasMore(response.data.pagination?.has_more || false);
        setOffset(currentOffset + newTransactions.length);
        setUsingRealData(true);
        setDataStatus('real');
      } else {
        console.log('⚠️ API returned unsuccessful response:', response.message);
        // Check if it's an authentication error
        if (response.message && response.message.includes('Authorization')) {
          console.log('🔐 Authentication required - using fallback data');
        }
        // Fallback to mock data
        const mockTransactions = generateMockTransactions();
        setTransactions(mockTransactions);
        setHasMore(false);
        setUsingRealData(false);
        setDataStatus('demo');
      }
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      console.error('❌ Error details:', error.message);
      
      // Check if it's an authentication error
      if (error.message && (error.message.includes('Invalid or expired token') || error.message.includes('Authorization'))) {
        console.log('🔐 Authentication error - using fallback data');
      } else if (error.message && error.message.includes('Network request failed')) {
        console.log('🌐 Network error - using fallback data');
      } else {
        console.log('⚠️ Other error - using fallback data');
      }
      
      // Fallback to mock data
      const mockTransactions = generateMockTransactions();
      setTransactions(mockTransactions);
      setHasMore(false);
      setUsingRealData(false);
      setDataStatus('demo');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  };

  const generateMockTransactions = () => {
    return [
      {
        id: 1,
        type: 'buy',
        amount: 5000,
        grams: 0.1234,
        rate: 40500,
        status: 'completed',
        txn_id: 'TXN_001',
        payment_mode: 'UPI',
        reference_id: 'REF_001',
        date: '2025-01-15 10:30:00'
      },
      {
        id: 2,
        type: 'sip',
        amount: 2000,
        grams: 0.0494,
        rate: 40500,
        status: 'completed',
        txn_id: 'SIP_001',
        payment_mode: 'SIP',
        reference_id: 'SIP-001',
        date: '2025-01-14 09:15:00'
      },
      {
        id: 3,
        type: 'sell',
        amount: 3000,
        grams: 0.0741,
        rate: 40450,
        status: 'pending',
        txn_id: 'TXN_002',
        payment_mode: 'Bank Transfer',
        reference_id: 'REF_002',
        date: '2025-01-13 14:20:00'
      },
      {
        id: 4,
        type: 'buy',
        amount: 10000,
        grams: 0.2469,
        rate: 40520,
        status: 'completed',
        txn_id: 'TXN_003',
        payment_mode: 'Net Banking',
        reference_id: 'REF_003',
        date: '2025-01-12 16:45:00'
      },
      {
        id: 5,
        type: 'sip',
        amount: 1500,
        grams: 0.0370,
        rate: 40500,
        status: 'completed',
        txn_id: 'SIP_002',
        payment_mode: 'SIP',
        reference_id: 'SIP-002',
        date: '2025-01-11 08:30:00'
      }
    ];
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(txn => txn.type === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(txn => 
        txn.txn_id?.toLowerCase().includes(query) ||
        txn.reference_id?.toLowerCase().includes(query) ||
        txn.payment_mode?.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions().finally(() => setRefreshing(false));
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      loadTransactions(true);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatGrams = (grams) => {
    return `${grams.toFixed(4)}g`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'buy': return '💰';
      case 'sell': return '💸';
      case 'sip': return '📈';
      default: return '📋';
    }
  };

  const renderTransaction = ({ item }) => (
    <TouchableOpacity style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionType}>
          <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
          <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Grams:</Text>
          <Text style={styles.detailValue}>{formatGrams(item.grams)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Rate:</Text>
          <Text style={styles.detailValue}>₹{item.rate.toLocaleString()}/g</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment:</Text>
          <Text style={styles.detailValue}>{item.payment_mode}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>TXN ID:</Text>
          <Text style={styles.detailValue}>{item.txn_id}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{formatDate(item.date)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filter) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterButton,
        selectedFilter === filter.key && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter.key)}
    >
      <Text style={styles.filterIcon}>{filter.icon}</Text>
      <Text style={[
        styles.filterText,
        selectedFilter === filter.key && styles.filterTextActive
      ]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="dark" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Transaction History</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by TXN ID, Reference ID..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {filters.map(renderFilterButton)}
          </ScrollView>
          {dataStatus === 'demo' && (
            <View style={styles.dataSourceIndicator}>
              <Text style={styles.dataSourceText}>📱 Demo Data</Text>
            </View>
          )}
          {dataStatus === 'real' && (
            <View style={[styles.dataSourceIndicator, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.dataSourceText}>✅ Live Data</Text>
              {lastUpdated && (
                <Text style={styles.lastUpdatedText}>Updated: {lastUpdated}</Text>
              )}
            </View>
          )}
          {dataStatus === 'loading' && loading && (
            <View style={[styles.dataSourceIndicator, { backgroundColor: '#2196F3' }]}>
              <Text style={styles.dataSourceText}>🔄 Loading...</Text>
            </View>
          )}
        </View>

        {/* Transactions List */}
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id.toString()}
          style={styles.transactionsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search terms' : 'Your transaction history will appear here'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffeec2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffeec2',
  },
  loadingText: {
    fontSize: 18,
    color: '#2c3e50',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff9e3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e3',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e0d0b0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#8B4513',
  },
  searchIcon: {
    fontSize: 18,
    color: '#8B4513',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 8,
    height: 40,
  },
  filtersScrollContent: {
    paddingVertical: 0,
    alignItems: 'center',
  },
  dataSourceIndicator: {
    position: 'absolute',
    right: 20,
    top: 0,
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dataSourceText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  lastUpdatedText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '400',
    opacity: 0.8,
    marginTop: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 15,
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filterText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transactionCard: {
    backgroundColor: '#fff9e3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0d0b0',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  typeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  transactionDetails: {
    gap: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#8B4513',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#8B4513',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B4513',
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#8B4513',
    opacity: 0.7,
  },
});

export default TransactionHistoryScreen;
