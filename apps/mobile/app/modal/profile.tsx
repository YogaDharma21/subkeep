import { UserProfileView } from "@clerk/expo/native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function ProfileModal() {
  const router = useRouter()
  const { colors } = useThemeColor()

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <UserProfileView
        isDismissible
        onDismiss={() => router.back()}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  )
}
