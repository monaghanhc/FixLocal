import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.meta}>FixLocal — Last updated: March 10, 2026</Text>

      <Section title="1. Overview">
        FixLocal ("we", "us", or "our") is a civic reporting app that lets you submit reports of
        local issues — such as potholes, broken streetlights, and graffiti — to the appropriate
        local authority. This Privacy Policy explains what data we collect, why we collect it, and
        how we protect it.
      </Section>

      <Section title="2. Information We Collect">
        <Bold>a) Location Data</Bold>
        {'\n'}When you submit a report, we request access to your device's GPS location. This is
        used solely to identify the correct local authority for your report and to attach an address
        to your submission. We do not track your location in the background.
        {'\n\n'}
        <Bold>b) Photos</Bold>
        {'\n'}You may optionally attach up to 4 photos to a report using your camera or photo
        library. Photos are uploaded securely and stored only in connection with the specific report
        they are attached to.
        {'\n\n'}
        <Bold>c) Account Information</Bold>
        {'\n'}You may use FixLocal anonymously without creating an account. If you choose to sign in
        with an email address (via a magic link), we store only your email address to associate your
        reports with your account.
        {'\n\n'}
        <Bold>d) Report Content</Bold>
        {'\n'}We store the content of your report submissions, including issue type, notes, location,
        and photos, in order to track the status of your report and generate the email sent to the
        local authority.
      </Section>

      <Section title="3. How We Use Your Information">
        We use the information we collect to:{'\n\n'}
        • Route your report to the correct local authority{'\n'}
        • Generate and send a report email to the appropriate government contact{'\n'}
        • Allow you to track the status of your submitted reports{'\n'}
        • Display aggregate, anonymised contribution counts on the community leaderboard{'\n'}
        • Improve the accuracy and reliability of the app
      </Section>

      <Section title="4. Data Sharing">
        We share your report data (issue type, location, notes, photos) with the relevant local
        authority to enable them to act on your report. We do not sell your personal data to any
        third party. We use the following third-party services:{'\n\n'}
        • <Bold>Supabase</Bold> — database and file storage (supabase.com/privacy){'\n'}
        • <Bold>OpenAI</Bold> — AI-generated email drafts (openai.com/policies/privacy-policy){'\n'}
        • <Bold>Resend</Bold> — email delivery (resend.com/legal/privacy-policy){'\n'}
        • <Bold>Expo / EAS</Bold> — mobile app platform (expo.dev/privacy)
      </Section>

      <Section title="5. Data Retention">
        We retain your report data for as long as your account is active or as needed to provide the
        service. Anonymous users' reports are retained for 12 months. You may request deletion of
        your data at any time by contacting us (see Section 8).
      </Section>

      <Section title="6. Security">
        All data is transmitted over HTTPS. Photos are stored in a private Supabase Storage bucket
        with access controls. We do not store passwords — authentication is handled via
        one-time email links only.
      </Section>

      <Section title="7. Children's Privacy">
        FixLocal is not directed to children under the age of 13. We do not knowingly collect
        personal information from children under 13. If you believe a child has provided us with
        personal information, please contact us and we will delete it promptly.
      </Section>

      <Section title="8. Your Rights">
        You have the right to:{'\n\n'}
        • Access the personal data we hold about you{'\n'}
        • Request correction of inaccurate data{'\n'}
        • Request deletion of your data{'\n'}
        • Withdraw consent at any time{'\n\n'}
        To exercise these rights, contact us at{' '}
        <Text style={styles.link}>hunter.monaghan5@gmail.com</Text>.
      </Section>

      <Section title="9. Changes to This Policy">
        We may update this Privacy Policy from time to time. We will notify you of any significant
        changes by updating the "Last updated" date at the top of this page. Continued use of the
        app after changes constitutes acceptance of the new policy.
      </Section>

      <Section title="10. Contact Us">
        If you have any questions about this Privacy Policy, please contact us:{'\n\n'}
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

function Bold({ children }: { children: string }) {
  return <Text style={styles.bold}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  meta: { fontSize: 13, color: '#888', marginBottom: 28 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  body: { fontSize: 14, color: '#444', lineHeight: 22 },
  bold: { fontWeight: '700', color: '#1a1a1a' },
  link: { color: '#007AFF', textDecorationLine: 'underline' },
});
