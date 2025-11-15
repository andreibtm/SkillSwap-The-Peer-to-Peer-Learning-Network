import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function TermsScreen() {
  const navigation = useNavigation();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-6">
      <Text className="text-white text-lg font-bold mb-3">{title}</Text>
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
        <Text className="text-white text-xl font-bold">Terms of Service</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="mb-4">
          <Text className="text-gray-400 text-sm mb-6">Last Updated: November 15, 2025</Text>
        </View>

        <Section title="1. Acceptance of Terms">
          By accessing and using SkillSwap ("the App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the App.
        </Section>

        <Section title="2. Description of Service">
          SkillSwap is a peer-to-peer learning network that connects individuals who want to share and learn skills. The platform allows users to create profiles, match with other learners, communicate through in-app messaging, and arrange skill-sharing sessions.
        </Section>

        <Section title="3. User Eligibility">
          You must be at least 18 years old to use this App. By using SkillSwap, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into this agreement.
        </Section>

        <Section title="4. User Accounts and Registration">
          {`• You must provide accurate, current, and complete information during registration
• You are responsible for maintaining the confidentiality of your account credentials
• You are responsible for all activities that occur under your account
• You must notify us immediately of any unauthorized use of your account
• We reserve the right to suspend or terminate accounts that violate these terms`}
        </Section>

        <Section title="5. User Conduct">
          You agree not to:
          {`\n• Use the App for any illegal or unauthorized purpose
• Harass, abuse, or harm other users
• Impersonate any person or entity
• Post false, inaccurate, or misleading information
• Engage in any form of spam or unsolicited advertising
• Upload viruses or malicious code
• Collect user information without consent
• Use the App for commercial purposes without authorization`}
        </Section>

        <Section title="6. Content Guidelines">
          {`• You retain ownership of content you post on SkillSwap
• You grant us a worldwide, non-exclusive license to use, display, and distribute your content
• You are solely responsible for your content
• We reserve the right to remove any content that violates these terms
• Content must not be offensive, discriminatory, or inappropriate`}
        </Section>

        <Section title="7. Skill-Sharing Arrangements">
          {`• All skill-sharing arrangements are made between users directly
• SkillSwap is not responsible for the quality or outcome of skill-sharing sessions
• Users should exercise caution when meeting others in person
• We recommend meeting in public places for safety
• SkillSwap does not verify skills, credentials, or qualifications of users`}
        </Section>

        <Section title="8. Privacy and Data">
          Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms of Service by reference.
        </Section>

        <Section title="9. Intellectual Property">
          {`• The App and its original content, features, and functionality are owned by SkillSwap
• Our trademarks and trade dress may not be used without written permission
• You may not copy, modify, or distribute any part of the App without authorization`}
        </Section>

        <Section title="10. Termination">
          {`• We may terminate or suspend your account at any time for violations of these terms
• You may terminate your account at any time through the app settings
• Upon termination, your right to use the App will immediately cease
• We reserve the right to delete your data after account termination`}
        </Section>

        <Section title="11. Disclaimers">
          {`• The App is provided "as is" without warranties of any kind
• We do not guarantee the accuracy, completeness, or usefulness of any information
• We are not responsible for user-generated content
• We do not guarantee uninterrupted or error-free service`}
        </Section>

        <Section title="12. Limitation of Liability">
          SkillSwap shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the App, including but not limited to damages for loss of profits, data, or other intangibles.
        </Section>

        <Section title="13. Indemnification">
          You agree to indemnify and hold harmless SkillSwap and its affiliates from any claims, damages, losses, liabilities, and expenses arising from your use of the App or violation of these terms.
        </Section>

        <Section title="14. Changes to Terms">
          We reserve the right to modify these terms at any time. We will notify users of significant changes through the App or via email. Continued use of the App after changes constitutes acceptance of the modified terms.
        </Section>

        <Section title="15. Governing Law">
          These Terms shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions.
        </Section>

        <Section title="16. Contact Information">
          If you have any questions about these Terms of Service, please contact us through the App's Help Center or Contact Us feature.
        </Section>

        <View className="mb-8">
          <View className="bg-[#2a2a2a] rounded-lg p-4 mt-4">
            <Text className="text-gray-300 text-sm text-center leading-5">
              By using SkillSwap, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </Text>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
