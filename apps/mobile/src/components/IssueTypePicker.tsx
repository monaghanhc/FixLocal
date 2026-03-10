import { Platform, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const ISSUE_TYPES = [
  { label: 'Pothole', value: 'pothole' },
  { label: 'Streetlight Out', value: 'streetlight_out' },
  { label: 'Graffiti', value: 'graffiti' },
  { label: 'Illegal Dumping', value: 'illegal_dumping' },
  { label: 'Road Sign Damage', value: 'road_sign_damage' },
  { label: 'Other', value: 'other' },
];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function IssueTypePicker({ value, onChange }: Props) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* @ts-ignore web-only */}
        <select
          value={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
          style={webSelectStyle}
        >
          {ISSUE_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </View>
    );
  }
  return (
    <View style={styles.nativeContainer}>
      <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
        {ISSUE_TYPES.map((item) => (
          <Picker.Item key={item.value} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
  );
}

const webSelectStyle = {
  width: '100%',
  padding: '10px',
  fontSize: '16px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  backgroundColor: '#fff',
  appearance: 'none' as const,
};

const styles = StyleSheet.create({
  webContainer: { width: '100%' },
  nativeContainer: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  picker: { height: 50 },
});
