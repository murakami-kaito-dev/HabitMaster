# HabitMaster

シンプルで使いやすい習慣トラッキングアプリです。

> **詳しいアプリの使い方・画面説明はこちら:** [APP_GUIDE.md](APP_GUIDE.md)

## 機能

- **習慣の作成・管理**: 習慣化したいことを登録し、詳細メモを追加できます
- **達成記録**: 毎日の達成状況を3段階（達成/未達成/未記録）で記録
- **週間ビュー**: ホーム画面で今週の達成状況を一目で確認
- **カレンダービュー**: 過去4週間分の記録を確認・編集可能
- **通知機能**: 曜日ごとにリマインダーを設定可能
- **多言語対応**: 日本語・英語に対応（端末設定に連動、手動切替可能）

## 技術スタック

- React Native / Expo (SDK 54)
- TypeScript
- Firebase (Authentication, Firestore)
- expo-router
- expo-notifications
- i18next / react-i18next（国際化）

## セットアップ

### 必要な環境

- Node.js
- npm または yarn
- Expo CLI

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npx expo start
```

### Firebase設定

`.env`ファイルをプロジェクトルートに作成し、Firebase設定を追加してください：

```
EXPO_PUBLIC_FB_API_KEY=your_api_key
EXPO_PUBLIC_FB_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FB_PROJECT_ID=your_project_id
EXPO_PUBLIC_FB_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FB_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FB_APP_ID=your_app_id
```

## ライセンス

MIT
