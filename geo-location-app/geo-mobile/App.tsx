import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, Button, FlatList, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'http://192.168.1.10:3000';

type Defect = {
  _id: string;
  title: string;
  description: string;
  laboratory: string;
  latitude: number;
  longitude: number;
  photo?: string | null;
  createdAt?: string;
};

export default function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [laboratory, setLaboratory] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDefects();
  }, []);

  const fetchDefects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/places`);
      const data = await res.json();
      setDefects(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os registros');
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir o acesso à localização.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setLatitude(location.coords.latitude);
    setLongitude(location.coords.longitude);
    Alert.alert('Sucesso', 'Localização obtida!');
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir o uso da câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.3, // Qualidade baixa para não pesar no envio
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        const base64Img = `data:image/jpeg;base64,${asset.base64}`;
        setPhoto(base64Img);
      }
    }
  };

  const handleSave = async () => {
    if (!title || !description || !laboratory || latitude == null || longitude == null) {
      Alert.alert('Campos obrigatórios', 'Preencha título, descrição, laboratório e capture a localização.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          laboratory,
          latitude,
          longitude,
          photo,
        }),
      });

      if (!res.ok) {
        Alert.alert('Erro', 'Falha ao salvar o registro no servidor.');
        return;
      }

      const created = await res.json();
      setDefects((prev) => [created, ...prev]);
      
      // Limpar campos
      setTitle('');
      setDescription('');
      setLaboratory('');
      setLatitude(null);
      setLongitude(null);
      setPhoto(null);
      
      Alert.alert('Sucesso', 'Defeito registrado com sucesso!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha na conexão com o backend.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Defect }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardLab}>📍 Lab: {item.laboratory}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
      
      <Text style={styles.cardInfo}>
        Lat: {item.latitude.toFixed(4)} | Lng: {item.longitude.toFixed(4)}
      </Text>
      
      {item.createdAt && (
        <Text style={styles.cardDate}>
          📅 {new Date(item.createdAt).toLocaleString('pt-BR')}
        </Text>
      )}

      {item.photo && (
        <Image source={{ uri: item.photo }} style={styles.cardImage} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.headerTitle}>Reportar Defeito</Text>

        <TextInput
          style={styles.input}
          placeholder="Título do defeito (ex: Microscópio quebrado)"
          value={title}
          onChangeText={setTitle}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Laboratório (ex: Lab Química 01)"
          value={laboratory}
          onChangeText={setLaboratory}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descrição detalhada do problema..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <View style={styles.buttonGroup}>
          <Button title={latitude ? "Localização OK ✅" : "📍 Pegar Localização"} onPress={getLocation} color="#4A90E2" />
          <View style={{ marginTop: 10 }}>
            <Button title={photo ? "Foto OK ✅" : "📷 Tirar Foto"} onPress={takePhoto} color="#F5A623" />
          </View>
        </View>

        {photo && <Image source={{ uri: photo }} style={styles.previewImage} />}

        <View style={styles.saveButton}>
          {loading ? (
            <ActivityIndicator size="large" color="#2ECC71" />
          ) : (
            <Button title="SALVAR REGISTRO" onPress={handleSave} color="#2ECC71" />
          )}
        </View>
      </ScrollView>

      <Text style={styles.listHeader}>Histórico de Defeitos</Text>
      <FlatList
        data={defects}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5', paddingTop: 40 },
  form: { padding: 16, backgroundColor: '#FFF', marginBottom: 10, elevation: 2 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 16, backgroundColor: '#FAFAFA' },
  textArea: { height: 80, textAlignVertical: 'top' },
  buttonGroup: { marginVertical: 10 },
  previewImage: { width: '100%', height: 200, borderRadius: 8, marginVertical: 10, resizeMode: 'cover' },
  saveButton: { marginTop: 10 },
  
  listHeader: { fontSize: 18, fontWeight: 'bold', marginLeft: 16, marginBottom: 10, color: '#555' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardLab: { fontSize: 14, color: '#E67E22', fontWeight: 'bold', marginBottom: 5 },
  cardDescription: { fontSize: 14, color: '#555', marginBottom: 8 },
  cardInfo: { fontSize: 12, color: '#888' },
  cardDate: { fontSize: 12, color: '#888', marginBottom: 8, fontStyle: 'italic' },
  cardImage: { width: '100%', height: 180, borderRadius: 8, marginTop: 5 },
});