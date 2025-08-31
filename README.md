# StreetPaws - Promoting Safe and Compassionate Communities

A comprehensive animal welfare platform built for the StreetPaws Lipa City Veterinary Office, designed to help stray animals find homes and provide veterinary care services.

## 🐾 Features

### Core Functionality
- **Animal Adoption**: Browse and adopt dogs and cats with detailed profiles
- **Lost & Found Reports**: Submit and view reports for lost or found animals
- **Abuse Reporting**: Report cases of animal abuse with evidence upload
- **User Authentication**: Secure login/signup with Firebase Authentication
- **Donation System**: Support the organization through online donations
- **Volunteer Management**: Information about volunteer opportunities

### User Interface
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern UI**: Clean, intuitive interface with accessibility features
- **Real-time Updates**: Live notifications and status updates
- **Image Upload**: Support for photos and videos with size validation

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: Firebase Realtime Database
- **Storage**: Firebase Storage
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Build Tool**: Vite

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn
- Firebase project setup

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd streetpaws
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   
   Create a Firebase project and update the configuration in `src/config/firebase.ts`:
   
   ```typescript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-auth-domain",
     projectId: "your-project-id",
     storageBucket: "your-storage-bucket",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id",
     databaseURL: "your-database-url"
   }
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── reportForms/    # Report form components
│   └── ...
├── contexts/           # React contexts
├── pages/              # Page components
├── stores/             # Zustand stores
├── config/             # Configuration files
└── types/              # TypeScript type definitions
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design System

### Colors
- **Primary**: Orange (#f97316) - Main brand color
- **Secondary**: Gray scale for text and backgrounds
- **Accent**: Various colors for different animal types

### Components
- **Buttons**: Primary, secondary, and outline variants
- **Forms**: Consistent input styling with validation
- **Modals**: Overlay modals for forms and dialogs
- **Cards**: Animal profile cards and information displays

## Theme & Color Palette

The StreetPaws app uses a soft, friendly color palette to create a welcoming and cute experience. The main colors are:

- **Primary Orange:** #F97316 (used for buttons, accents, and highlights)
- **Soft Orange:** #FEF3E7 (backgrounds, cards)
- **Gray:** #F3F4F6, #D1D5DB (backgrounds, borders, text)
- **Black:** #111827 (main text)
- **White:** #FFFFFF (backgrounds, cards)

### UI Style
- Rounded corners and drop shadows for cards and modals
- Playful accent borders and icons
- Large, friendly input fields and buttons
- Modal forms are centered, with padding and overlay
- Consistent use of theme colors for each report type

Feel free to adjust the palette in `tailwind.config.js` or your CSS for your own branding!

## Tech Stack

- **Programming Languages:** TypeScript, JavaScript
- **Framework:** React
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Forms:** react-hook-form
- **Icons:** Lucide-react
- **Notifications:** react-hot-toast
- **Firebase:** (for authentication and backend)

## 🔐 Authentication

The application uses Firebase Authentication with:
- Email/password authentication
- Third-party login options (Google, Facebook, Apple)
- Protected routes for authenticated users
- User profile management

## 📊 Database Schema

### Animals Collection
```typescript
interface Animal {
  id: string
  name: string
  type: 'dog' | 'cat'
  breed: string
  age: string
  gender: string
  description: string
  images: string[]
  status: 'available' | 'adopted' | 'pending'
  createdAt: timestamp
}
```

### Reports Collection
```typescript
interface Report {
  id: string
  type: 'lost' | 'found' | 'abused'
  animalInfo: object
  location: string
  date: timestamp
  contactInfo: object
  images: string[]
  status: 'open' | 'resolved' | 'closed'
  createdAt: timestamp
}
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@streetpaws.com or create an issue in the repository.

## 🙏 Acknowledgments

- StreetPaws Lipa City Veterinary Office
- Firebase for backend services
- Tailwind CSS for styling
- React community for excellent tools and libraries

---

**StreetPaws** - Making the world a better place for animals, one adoption at a time. 🐕🐱