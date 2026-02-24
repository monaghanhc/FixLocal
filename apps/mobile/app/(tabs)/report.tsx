import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { useNetInfo } from '@react-native-community/netinfo';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { issueTypeOptions, type ReportPayload } from '@fixlocal/shared';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ApiError, submitReport, type LocalPhoto } from '@/src/lib/api';
import { useAuth } from '@/src/providers/AuthProvider';

const reportFormSchema = z.object({
  issueType: z.enum(issueTypeOptions),
  notes: z.string().max(2000),
  city: z.string().trim().min(1, 'City is required.'),
  state: z.string().trim().min(1, 'State is required.'),
  zip: z.string().trim().min(3, 'ZIP is required.'),
  formattedAddress: z.string().trim().max(200).optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

const MAX_PHOTOS = 4;

const formatAddress = (geocoded: Location.LocationGeocodedAddress): string => {
  const street = geocoded.street ? `${geocoded.street} ${geocoded.streetNumber ?? ''}`.trim() : '';
  const city = geocoded.city ?? geocoded.subregion ?? '';
  const state = geocoded.region ?? '';
  const zip = geocoded.postalCode ?? '';
  return [street, city && `${city}, ${state} ${zip}`.trim()].filter(Boolean).join(', ');
};

const normalizeAsset = async (asset: ImagePicker.ImagePickerAsset): Promise<LocalPhoto> => {
  const actions: ImageManipulator.Action[] = [];
  if (asset.width && asset.width > 1600) {
    actions.push({ resize: { width: 1600 } });
  }

  const manipulated = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: 0.72,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  const baseName = asset.fileName?.replace(/\.[^/.]+$/, '') || `issue-${Date.now()}`;
  return {
    uri: manipulated.uri,
    name: `${baseName}.jpg`,
    type: 'image/jpeg',
  };
};

export default function ReportIssueScreen() {
  const router = useRouter();
  const netInfo = useNetInfo();
  const { session } = useAuth();
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewBody, setPreviewBody] = useState('');
  const [generationNote, setGenerationNote] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      issueType: 'Pothole',
      notes: '',
      city: '',
      state: '',
      zip: '',
      formattedAddress: '',
    },
  });

  const isOffline = netInfo.isConnected === false;

  const canGeneratePreview = useMemo(() => {
    return !isOffline && photos.length > 0 && Boolean(coordinates) && !isGeneratingPreview;
  }, [coordinates, isGeneratingPreview, isOffline, photos.length]);

  const syncLocation = async () => {
    setFeedback(null);
    setIsLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setFeedback('Location access is required to route reports correctly.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCoordinates(nextCoords);

      const reverse = await Location.reverseGeocodeAsync(nextCoords);
      const best = reverse[0];
      if (best) {
        setValue('city', best.city ?? best.subregion ?? '', { shouldValidate: true });
        setValue('state', best.region ?? '', { shouldValidate: true });
        setValue('zip', best.postalCode ?? '', { shouldValidate: true });
        setValue('formattedAddress', formatAddress(best), { shouldValidate: true });
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Could not determine location.');
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    void syncLocation();
  }, []);

  const addAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    if (assets.length === 0) {
      return;
    }

    const remainingSlots = Math.max(0, MAX_PHOTOS - photos.length);
    const selected = assets.slice(0, remainingSlots);
    const normalized = await Promise.all(selected.map(normalizeAsset));
    setPhotos((current) => [...current, ...normalized].slice(0, MAX_PHOTOS));
    setHasPreview(false);
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFeedback('Photo library permission is required to select an attachment.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, MAX_PHOTOS - photos.length),
      quality: 0.8,
    });

    if (!result.canceled) {
      await addAssets(result.assets);
    }
  };

  const capturePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setFeedback('Camera permission is required to capture a report photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      await addAssets(result.assets);
    }
  };

  const removePhoto = (uri: string) => {
    setPhotos((current) => current.filter((photo) => photo.uri !== uri));
    setHasPreview(false);
  };

  const buildLocationPayload = (values: ReportFormValues): ReportPayload['location'] | null => {
    if (!coordinates) {
      return null;
    }

    return {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      city: values.city.trim(),
      state: values.state.trim(),
      zip: values.zip.trim(),
      formattedAddress: values.formattedAddress?.trim() || undefined,
    };
  };

  const runPreview = handleSubmit(async (values) => {
    if (!session) {
      setFeedback('No active session. Please sign in again.');
      return;
    }

    if (photos.length === 0) {
      setFeedback('Attach at least one photo before generating a preview.');
      return;
    }

    if (isOffline) {
      setFeedback('You appear to be offline. Connect to the internet to generate preview.');
      return;
    }

    const locationPayload = buildLocationPayload(values);
    if (!locationPayload) {
      setFeedback('Location is missing. Refresh location and try again.');
      return;
    }

    setFeedback(null);
    setIsGeneratingPreview(true);
    try {
      const response = await submitReport({
        token: session.access_token,
        userId: session.user.id,
        issueType: values.issueType,
        notes: values.notes.trim() || undefined,
        location: locationPayload,
        photos,
        mode: 'preview',
      });

      setPreviewSubject(response.emailPreview.subject);
      setPreviewBody(response.emailPreview.body);
      setHasPreview(true);

      if (response.generation?.strategy === 'fallback') {
        setGenerationNote(
          response.generation.fallbackReason
            ? `AI draft fallback used: ${response.generation.fallbackReason}`
            : 'AI draft fallback template was used.',
        );
      } else {
        setGenerationNote('AI-assisted draft generated.');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFeedback(error.message);
      } else {
        setFeedback(error instanceof Error ? error.message : 'Could not generate email preview.');
      }
    } finally {
      setIsGeneratingPreview(false);
    }
  });

  const runSend = handleSubmit(async (values) => {
    if (!session) {
      setFeedback('No active session. Please sign in again.');
      return;
    }

    if (!hasPreview) {
      setFeedback('Generate and review the email preview before sending.');
      return;
    }

    const locationPayload = buildLocationPayload(values);
    if (!locationPayload) {
      setFeedback('Location is missing. Refresh location and try again.');
      return;
    }

    setFeedback(null);
    setIsSending(true);
    try {
      const response = await submitReport({
        token: session.access_token,
        userId: session.user.id,
        issueType: values.issueType,
        notes: values.notes.trim() || undefined,
        location: locationPayload,
        photos,
        mode: 'send',
        subject: previewSubject,
        body: previewBody,
      });

      if (response.report?.status === 'sent') {
        Alert.alert('Report sent', 'Your report was emailed to the relevant department.');
      } else {
        Alert.alert('Report queued', 'The report was saved but has not been marked as sent yet.');
      }

      setPhotos([]);
      setPreviewSubject('');
      setPreviewBody('');
      setHasPreview(false);
      setGenerationNote(null);
      setValue('notes', '');
      router.push('/(tabs)/history');
    } catch (error) {
      if (error instanceof ApiError && error.status === 502) {
        setFeedback(
          'Email delivery failed, but the report has been logged as failed in history for retry/manual follow-up.',
        );
      } else {
        setFeedback(error instanceof Error ? error.message : 'Unable to send report.');
      }
    } finally {
      setIsSending(false);
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Create Report</Text>
        <Text style={styles.subheading}>
          Attach photos, confirm location, generate an email draft, and send to the right authority.
        </Text>

        {isOffline ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>You are offline. Preview and send actions are disabled.</Text>
          </View>
        ) : null}

        {feedback ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{feedback}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photos</Text>
          <Text style={styles.helperText}>Add up to {MAX_PHOTOS} photos.</Text>
          <View style={styles.row}>
            <Pressable style={styles.outlineButton} onPress={capturePhoto}>
              <Text style={styles.outlineButtonText}>Take Photo</Text>
            </Pressable>
            <Pressable style={styles.outlineButton} onPress={pickFromLibrary}>
              <Text style={styles.outlineButtonText}>Choose Photo</Text>
            </Pressable>
          </View>

          <View style={styles.photoGrid}>
            {photos.map((photo) => (
              <Pressable key={photo.uri} onPress={() => removePhoto(photo.uri)} style={styles.photoContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                <Text style={styles.removeLabel}>Remove</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.cardTitle}>Location</Text>
            <Pressable onPress={syncLocation} disabled={isLocating}>
              <Text style={styles.inlineAction}>{isLocating ? 'Locating...' : 'Refresh'}</Text>
            </Pressable>
          </View>
          <Text style={styles.coordsText}>
            {coordinates
              ? `Lat ${coordinates.latitude.toFixed(5)}, Lng ${coordinates.longitude.toFixed(5)}`
              : 'Coordinates unavailable'}
          </Text>

          <Controller
            control={control}
            name="formattedAddress"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  setHasPreview(false);
                }}
                placeholder="Street address (optional)"
                placeholderTextColor="#94a3b8"
              />
            )}
          />

          <View style={styles.row}>
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, styles.flexInput]}
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    setHasPreview(false);
                  }}
                  placeholder="City"
                  placeholderTextColor="#94a3b8"
                />
              )}
            />
            <Controller
              control={control}
              name="state"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, styles.stateInput]}
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    setHasPreview(false);
                  }}
                  placeholder="State"
                  placeholderTextColor="#94a3b8"
                />
              )}
            />
            <Controller
              control={control}
              name="zip"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, styles.zipInput]}
                  value={value}
                  keyboardType="number-pad"
                  onChangeText={(text) => {
                    onChange(text);
                    setHasPreview(false);
                  }}
                  placeholder="ZIP"
                  placeholderTextColor="#94a3b8"
                />
              )}
            />
          </View>
          {(errors.city || errors.state || errors.zip) && (
            <Text style={styles.inlineError}>
              {errors.city?.message || errors.state?.message || errors.zip?.message}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Issue details</Text>
          <Controller
            control={control}
            name="issueType"
            render={({ field: { value, onChange } }) => (
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={value}
                  onValueChange={(nextValue) => {
                    onChange(nextValue);
                    setHasPreview(false);
                  }}
                >
                  {issueTypeOptions.map((option) => (
                    <Picker.Item key={option} label={option} value={option} />
                  ))}
                </Picker>
              </View>
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { value, onChange } }) => (
              <TextInput
                style={[styles.input, styles.multilineInput]}
                multiline
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  setHasPreview(false);
                }}
                placeholder="Optional notes: hazard severity, nearest landmark, etc."
                placeholderTextColor="#94a3b8"
              />
            )}
          />
        </View>

        <Pressable
          style={[styles.primaryButton, !canGeneratePreview && styles.disabledButton]}
          disabled={!canGeneratePreview}
          onPress={runPreview}
        >
          <Text style={styles.primaryButtonText}>
            {isGeneratingPreview ? 'Generating...' : 'Generate Email Preview'}
          </Text>
        </Pressable>

        {hasPreview ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Email Preview</Text>
            {generationNote ? <Text style={styles.helperText}>{generationNote}</Text> : null}
            <TextInput
              style={styles.input}
              value={previewSubject}
              onChangeText={setPreviewSubject}
              placeholder="Email subject"
              placeholderTextColor="#94a3b8"
            />
            <TextInput
              style={[styles.input, styles.previewBodyInput]}
              multiline
              value={previewBody}
              onChangeText={setPreviewBody}
              placeholder="Email body"
              placeholderTextColor="#94a3b8"
            />
            <Pressable
              style={[styles.primaryButton, isSending && styles.disabledButton]}
              disabled={isSending}
              onPress={runSend}
            >
              <Text style={styles.primaryButtonText}>{isSending ? 'Sending...' : 'Send Report'}</Text>
            </Pressable>
          </View>
        ) : null}

        {photos.length === 0 ? (
          <Text style={styles.footerNote}>Add at least one photo to enable preview generation.</Text>
        ) : null}

        <Text style={styles.footerNote}>
          Current issue type: <Text style={styles.footerValue}>{getValues('issueType')}</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef2ff',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subheading: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  warningBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#facc15',
    backgroundColor: '#fef9c3',
    padding: 12,
  },
  warningText: {
    color: '#854d0e',
    fontWeight: '600',
  },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fee2e2',
    padding: 12,
  },
  errorText: {
    color: '#991b1b',
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#0f172a',
    fontSize: 17,
  },
  helperText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#0f766e',
    fontWeight: '700',
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  photoContainer: {
    width: 88,
    gap: 4,
    alignItems: 'center',
  },
  photoPreview: {
    width: 88,
    height: 88,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  removeLabel: {
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineAction: {
    color: '#0f766e',
    fontWeight: '700',
  },
  coordsText: {
    color: '#334155',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
    fontSize: 15,
  },
  flexInput: {
    flex: 1,
  },
  stateInput: {
    width: 72,
  },
  zipInput: {
    width: 96,
  },
  inlineError: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  previewBodyInput: {
    minHeight: 180,
    textAlignVertical: 'top',
  },
  footerNote: {
    color: '#64748b',
    fontSize: 12,
  },
  footerValue: {
    fontWeight: '700',
    color: '#0f172a',
  },
});
