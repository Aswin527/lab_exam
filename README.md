# Python Lab Exam Application

A comprehensive exam management system for Python programming assessments with real-time code evaluation and MCQ testing.

## Features

- **Student Interface**: Secure fullscreen exam environment
- **Admin Panel**: Complete exam management system
- **Code Evaluation**: Real-time Python code testing
- **MCQ Assessment**: Multiple choice question support
- **Database Integration**: Supabase backend for data persistence
- **Security Features**: Fullscreen enforcement and violation tracking

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Code Editor**: CodeMirror
- **Icons**: Lucide React

## Deployment on Render

### Prerequisites

1. **Supabase Account**: Set up a Supabase project
2. **Render Account**: Create a free Render account
3. **GitHub Repository**: Push your code to GitHub

### Step-by-Step Deployment

#### 1. Supabase Setup
```bash
# 1. Create a new Supabase project at https://supabase.com
# 2. Get your project URL and anon key from Settings > API
# 3. The database schema will be created automatically
```

#### 2. Deploy to Render
```bash
# Option 1: Using Render Dashboard
# 1. Go to https://render.com
# 2. Click "New" > "Web Service"
# 3. Connect your GitHub repository
# 4. Use these settings:
#    - Build Command: npm install && npm run build
#    - Start Command: npm start
#    - Environment: Node

# Option 2: Using render.yaml (included in project)
# 1. Push code to GitHub with render.yaml file
# 2. Connect repository to Render
# 3. Render will auto-deploy using the configuration
```

#### 3. Environment Variables
Set these in Render Dashboard > Environment:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=production
```

#### 4. Custom Domain (Optional)
```bash
# In Render Dashboard:
# 1. Go to Settings > Custom Domains
# 2. Add your domain
# 3. Configure DNS records as shown
```

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables (.env)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage

### Admin Access
- Username: `admin`
- Password: `exam2025`

### Features
- **Student Management**: Add/edit students with bulk upload
- **Question Bank**: Create coding questions with test cases
- **MCQ Management**: Create multiple choice questions
- **Exam Sessions**: Monitor live exams and view results
- **Results Export**: Download exam results as CSV

### Exam Flow
1. **Student Login**: Select class, section, and name
2. **Coding Phase**: Solve 2 programming questions (40 minutes)
3. **MCQ Phase**: Answer 10 multiple choice questions (20 minutes)
4. **Auto-Submit**: Automatic submission when time expires
5. **Results**: Immediate scoring (80% coding + 20% MCQ)

## Security Features

- **Fullscreen Enforcement**: Prevents students from exiting during exam
- **Violation Tracking**: Logs all security breach attempts
- **Auto-Recovery**: Forces return to exam environment
- **Time Management**: Automatic phase transitions and submission

## Support

For issues or questions, please check the admin panel or contact your system administrator.

## License

This project is for educational use only.