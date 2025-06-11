import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

const ServiceDetails = ({ service }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.serviceTitle}>{service?.name}</Text>
      <View style={styles.serviceInfo}>
        <Text style={styles.servicePrice}>
           Rs. {Number(service.price).toLocaleString('en-PK')}
         </Text>
        
       
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8e44ad',
  },
  
});

export default ServiceDetails;