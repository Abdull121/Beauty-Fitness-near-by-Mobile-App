import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function PlaceAutocomplete({ 
  onSelect, 
  placeholder = "Search location", 
  apiKey, 
  placeInfo,
  debounceTime = 300 // Default debounce time in milliseconds
}) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [timeoutId, setTimeoutId] = useState(null);
  
  // Debounced API call function using useCallback
  const debouncedFetchSuggestions = useCallback(async (text) => {
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.gomaps.pro/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${apiKey}`
      );
      const json = await response.json();
      if (json?.predictions) {
        setSuggestions(json.predictions);
      }
    } catch (error) {
      Alert.alert(error)
      // console.error('Place autocomplete error:', error);
      setSuggestions([]);
    }
  }, [apiKey]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const handleInputChange = (text) => {
    setInput(text);
    
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      debouncedFetchSuggestions(text);
    }, debounceTime);

    setTimeoutId(newTimeoutId);
  };

  const handleSuggestionPress = (place) => {
    setInput(place.description);
    setSuggestions([]);
    if (onSelect) {
      onSelect({
        place_id: place.place_id,
        description: place.description,
      });
    }
  };

  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Text numberOfLines={1} style={styles.suggestionText}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={placeholder}
          value={input}
          onChangeText={handleInputChange}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={renderSuggestionItem}
          style={styles.suggestionList}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    marginBottom: 10,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  suggestionList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 200,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
});