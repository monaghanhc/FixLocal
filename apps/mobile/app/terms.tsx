import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.meta}>FixLocal — Last updated: March 10, 2026</Text>

      <Section title="1. Acceptance of Terms">
        By downloading, installing, or using the FixLocal app or website ("Service"), you agree to
        be bound by these Terms of Service. If you do not agree, do not use the Service.
      </Section>

      <Section title="2. Description of Service">
        FixLocal is a civic reporting tool that allows users to submit reports of local issues to
        the appropriate municipal authority. We act as an intermediary — we do not guarantee that
        any authority will respond to or act upon your report.
      </Section>

      <Section title="3. User Responsibilities">
        You agree to:{'\n\n'}
        • Submit only accurate, truthful, and relevant reports{'\n'}
        • Not submit false, misleading, or malicious reports{'\n'}
        • Not use the Service for any unlawful purpose{'\n'}
        • Not attempt to abuse, overload, or exploit the Service{'\n'}
        • Not submit content that is defamatory, offensive, or violates any third party's rights
      </Section>

      <Section title="4. Content Ownership">
        You retain ownership of any photos and content you submit. By submitting content, you grant
        FixLocal a non-exclusive, royalty-free licence to use, store, and transmit that content
        solely for the purpose of providing the Service (e.g. forwarding your report to the
        relevant authority).
      </Section>

      <Section title="5. Disclaimer of Warranties">
        The Service is provided "as is" without warranties of any kind. We do not warrant that:{'\n\n'}
        • The Service will be uninterrupted or error-free{'\n'}
        • Reports will be received or acted upon by local authorities{'\n'}
        • The AI-generated email drafts will be accurate or appropriate in all cases{'\n\n'}
        Use of the Service is at your own risk.
      </Section>

      <Section title="6. Limitation of Liability">
        To the maximum extent permitted by law, FixLocal and its operators shall not be liable for
        any indirect, incidental, special, or consequential damages arising from your use of the
        Service, including failure of local authorities to respond to reports.
      </Section>

      <Section title="7. Third-Party Services">
        The Service integrates with third-party platforms including Supabase, OpenAI, and Resend.
        Your use of those services is governed by their respective terms and privacy policies. We
        are not responsible for the actions or policies of these third parties.
      </Section>

      <Section title="8. Termination">
        We reserve the right to suspend or terminate your access to the Service at any time, without
        notice, if we believe you have violated these Terms or for any other reason at our
        discretion.
      </Section>

      <Section title="9. Changes to Terms">
        We may revise these Terms at any time. Continued use of the Service after changes are posted
        constitutes your acceptance of the revised Terms. The "Last updated" date at the top of this
        page will reflect any changes.
      </Section>

      <Section title="10. Governing Law">
        These Terms are governed by the laws of the jurisdiction in which the operator is based.
        Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of
        the courts of that jurisdiction.
      </Section>

      <Section title="11. Contact">
        For any questions regarding these Terms, contact us at:{'\n\n'}
        Email: hunter.monaghan5@gmail.com{'\n'}
        Website: https://fixlocal-app.vercel.app
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  meta: { fontSize: 13, color: '#888', marginBottom: 28 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  body: { fontSize: 14, color: '#444', lineHeight: 22 },
  bold: { fontWeight: '700' },
});
