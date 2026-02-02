# Civil Alert System

**Integrated Platform for Crowdsourced Ocean Hazard Reporting and Analytics**

This project is a sophisticated mobile application designed to empower citizens to report ocean-related hazards (high waves, storm surges, flooding) in real-time. It serves as a bridge between ground-level observations and institutional early-warning systems, providing authorities with verified, geospatial intelligence.

## 🚀 Key Features

### 📱 Citizen Mobile App
*   **Real-time Reporting**: Capture and report hazards with GPS precision.
*   **Media Support**: Attach photos and videos to reports for evidence.
*   **Offline-First**: Fully functional in low-connectivity areas. Reports sync automatically when connection is restored.
*   **Live Map**: visualize nearby verified reports and risk zones using OpenStreetMap.
*   **Multilingual**: Designed for regional adaptability (Localization support).

### 🛡️ Backend & Security
*   **Supabase Integration**: Robust backend-as-a-service for Auth, Database, and Storage.
*   **Row Level Security (RLS)**: Ensures data privacy and secure access controls.
*   **Edge Functions**: Serverless logic for report verification and notifications.

## 🛠️ Technology Stack

### Mobile Application (Frontend)
*   **Framework**: [Flutter](https://flutter.dev/) (Dart)
*   **State Management**: [Riverpod](https://riverpod.dev/) (`flutter_riverpod`, `riverpod`)
*   **Maps**: `flutter_map` with OpenStreetMap (No API keys required)
*   **Local Storage**: `hive_flutter`, `shared_preferences`
*   **Background Tasks**: `workmanager` (planned/implied for sync)
*   **Media**: `camera`, `flutter_image_compress`, `video_compress`
*   **Networking**: `http`, `connectivity_plus`

### Backend Infrastructure
*   **Platform**: [Supabase](https://supabase.com/)
*   **Database**: PostgreSQL with PostGIS for geospatial queries.
*   **Auth**: Supabase Auth (Email/Password, OTP).
*   **Storage**: Supabase Storage for media evidence.
*   **Logic**: Supabase Edge Functions.

## 📂 Project Structure

```text
lib/
├── core/            # Core utilities, constants, and configuration
├── l10n/            # Localization files
├── models/          # Data models and JSON serialization
├── providers/       # Riverpod providers for state management
├── screens/         # UI Screens (Home, Report, Map, Profile)
├── services/        # External services (Supabase, Location, etc.)
├── theme/           # App theming and styling
├── widgets/         # Reusable UI components
└── main.dart        # Application entry point

supabase/
└── migrations/      # Database schema migrations
```

## ⚡ Getting Started

### Prerequisites
*   [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.10.0 or higher)
*   Supabase Account and Project

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/civil_alert_system.git
    cd civil_alert_system
    ```

2.  **Install dependencies**
    ```bash
    flutter pub get
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory (copy from `.env.example` if available) and add your Supabase credentials:
    ```env
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    *Note: Ensure you have `flutter dist` or a configured environment loader if using `.env` files directly, or configure these in your launch configuration.*

4.  **Run the App**
    ```bash
    flutter run
    ```

## 🤝 Contribution

Contributions are welcome! Please feel free to report issues or submit pull requests.

## 📄 License

[License Type] - See LICENSE file for details.
