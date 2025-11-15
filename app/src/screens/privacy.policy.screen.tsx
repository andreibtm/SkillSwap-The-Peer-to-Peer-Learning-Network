import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-6">
      <Text className="text-white text-lg font-bold mb-3">{title}</Text>
      <Text className="text-gray-300 text-base leading-6">{children}</Text>
    </View>
  );

  const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-4 ml-2">
      <Text className="text-white text-base font-semibold mb-2">{title}</Text>
      <Text className="text-gray-300 text-base leading-6">{children}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 mb-4 border-b border-[#2a2a2a]">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Privacy Policy</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="mb-4">
          <Text className="text-gray-400 text-sm mb-6">Last Updated: November 15, 2025</Text>
          <Text className="text-gray-300 text-base leading-6 mb-6">
            At SkillSwap, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </Text>
        </View>

        <Section title="1. Information We Collect">
          We collect information that you provide directly to us and information that is automatically collected when you use our App.
        </Section>

        <SubSection title="Personal Information You Provide">
          {`• Account Information: Name, email address, password, profile picture
• Profile Details: Skills you want to teach or learn, bio, location, availability
• User-Generated Content: Photos, messages, reviews, and other content you post
• Communication Data: Messages sent through our in-app chat feature
• Verification Information: Phone number (if you choose to verify your account)`}
        </SubSection>

        <SubSection title="Automatically Collected Information">
          {`• Device Information: Device type, operating system, unique device identifiers
• Usage Data: Features you use, time spent on the app, interactions with other users
• Location Data: Approximate location based on IP address or precise location if you grant permission
• Log Data: IP address, browser type, pages visited, time and date of visits
• Cookies and Similar Technologies: We use cookies and similar tracking technologies`}
        </SubSection>

        <Section title="2. How We Use Your Information">
          We use the information we collect for various purposes, including:
        </Section>

        <View className="mb-6 ml-2">
          <Text className="text-gray-300 text-base leading-6">
            {`• To create and manage your account
• To facilitate skill-matching between users
• To enable communication between matched users
• To personalize your experience and show relevant content
• To send you notifications about matches, messages, and app updates
• To improve our services and develop new features
• To detect, prevent, and address technical issues and fraud
• To comply with legal obligations
• To send you marketing communications (with your consent)
• To analyze usage patterns and optimize app performance`}
          </Text>
        </View>

        <Section title="3. How We Share Your Information">
          We may share your information in the following circumstances:
        </Section>

        <SubSection title="With Other Users">
          Your profile information (name, photo, bio, skills, location) is visible to other users when you match with them or appear in their search results.
        </SubSection>

        <SubSection title="With Service Providers">
          We share information with third-party service providers who perform services on our behalf, such as hosting, data analysis, payment processing, and customer service.
        </SubSection>

        <SubSection title="For Legal Reasons">
          We may disclose your information if required by law, legal process, or government request, or to protect the rights, property, or safety of SkillSwap, our users, or others.
        </SubSection>

        <SubSection title="Business Transfers">
          If SkillSwap is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
        </SubSection>

        <SubSection title="With Your Consent">
          We may share information with third parties when you give us explicit consent to do so.
        </SubSection>

        <Section title="4. Data Retention">
          We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. When you delete your account, we will delete or anonymize your personal information within 30 days, unless we are required to retain it for legal purposes.
        </Section>

        <Section title="5. Your Privacy Rights">
          Depending on your location, you may have certain rights regarding your personal information:
        </Section>

        <View className="mb-6 ml-2">
          <Text className="text-gray-300 text-base leading-6">
            {`• Access: Request access to your personal information
• Correction: Request correction of inaccurate or incomplete data
• Deletion: Request deletion of your personal information
• Portability: Request a copy of your data in a portable format
• Objection: Object to processing of your personal information
• Withdrawal of Consent: Withdraw consent for data processing at any time
• Do Not Sell: Opt-out of the sale of personal information (we do not sell your data)`}
          </Text>
        </View>

        <Text className="text-gray-300 text-base leading-6 mb-6 ml-2">
          To exercise these rights, please contact us through the app's settings or Help Center.
        </Text>

        <Section title="6. Data Security">
          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
        </Section>

        <SubSection title="Security Measures Include">
          {`• Encryption of data in transit and at rest
• Regular security assessments and updates
• Access controls and authentication requirements
• Monitoring for suspicious activity
• Employee training on data protection`}
        </SubSection>

        <Section title="7. Location Information">
          We may collect and use your location information to help you find nearby skill-sharing opportunities and to show your approximate location to other users. You can control location permissions through your device settings. Disabling location services may limit certain features of the app.
        </Section>

        <Section title="8. Children's Privacy">
          SkillSwap is not intended for users under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that a child under 18 has provided us with personal information, we will take steps to delete such information.
        </Section>

        <Section title="9. Third-Party Links and Services">
          Our App may contain links to third-party websites or services that are not owned or controlled by SkillSwap. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party sites you visit.
        </Section>

        <Section title="10. International Data Transfers">
          Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. When we transfer your information, we take appropriate safeguards to ensure your data remains protected.
        </Section>

        <Section title="11. Cookies and Tracking Technologies">
          We use cookies, web beacons, and similar technologies to collect information about your use of the App. You can control cookies through your browser settings, but disabling cookies may affect your ability to use certain features.
        </Section>

        <Section title="12. Push Notifications">
          We may send you push notifications about matches, messages, and app updates. You can opt-out of receiving push notifications by adjusting your device settings or app notification preferences.
        </Section>

        <Section title="13. Analytics">
          We use third-party analytics services to help us understand how users interact with our App. These services may collect information about your device and usage patterns. We use this information to improve our services and user experience.
        </Section>

        <Section title="14. Changes to This Privacy Policy">
          We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of significant changes by posting a notice in the App or sending you an email. Your continued use of the App after changes become effective constitutes acceptance of the updated Privacy Policy.
        </Section>

        <Section title="15. California Privacy Rights">
          If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to delete your information, and the right to opt-out of the sale of your information (we do not sell personal information).
        </Section>

        <Section title="16. European Privacy Rights">
          If you are located in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR), including the right to access, rectify, erase, restrict processing, data portability, and to object to processing of your personal data.
        </Section>

        <Section title="17. Contact Us">
          If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us through:
          {`\n\n• The Help Center in the app
• The Contact Us feature in Settings
• Email: privacy@skillswap.app`}
        </Section>

        <View className="mb-8">
          <View className="bg-[#2a2a2a] rounded-lg p-4 mt-4">
            <Text className="text-gray-300 text-sm text-center leading-5">
              By using SkillSwap, you acknowledge that you have read and understood this Privacy Policy and agree to the collection, use, and disclosure of your information as described herein.
            </Text>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
