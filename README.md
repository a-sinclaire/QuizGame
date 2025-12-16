# Quiz Game

A browser-based quiz game designed to run on GitHub Pages, serving as both an assessment tool and a learning resource. The quiz supports multiple question packs, making it content-agnostic and customizable.

## Features

- ✅ **Three Difficulty Levels**: Easy, Medium, and Hard (with automatic progression)
- ✅ **Educational Feedback**: Detailed explanations for both correct and incorrect answers
- ✅ **Category Selection**: Choose specific modules or random selection
- ✅ **Hints System**: Progressive hints for each question
- ✅ **Review Mode**: Study mode to review all questions with explanations
- ✅ **Save/Resume**: Automatically save progress and resume incomplete quizzes
- ✅ **High Scores & Statistics**: Track your best scores and overall statistics
- ✅ **Dark Mode**: Light and dark themes with system preference detection
- ✅ **Sound Effects**: Audio feedback for correct/incorrect answers
- ✅ **Share Results**: Copy formatted results to clipboard
- ✅ **Question Reporting**: Report issues with questions (creates GitHub issues)
- ✅ **Animations**: Smooth transitions and visual feedback
- ✅ **Mobile-Friendly**: Responsive design that works on all devices
- ✅ **Dynamic Question Packs**: Support for built-in, secure (GitLab), and custom question packs
- ✅ **GitLab OAuth**: Secure authentication for accessing private question packs

## Project Status

✅ **Fully Functional** - All core features are implemented and tested!

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed project structure and design decisions.

## Getting Started

### Local Development

1. Clone the repository
2. Open `index.html` in a web browser, or
3. Run a local server:
   ```bash
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser

### GitHub Pages Deployment

1. **Create a GitHub repository** (if you haven't already):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/QuizGame.git
   git branch -M main
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` (or `master`)
   - Folder: `/ (root)`
   - Click Save

3. **Configure GitHub Issue Creation**:
   - Edit `index.html`
   - Update `window.quizConfig` with your repository details:
     ```javascript
     window.quizConfig = {
         repoOwner: 'YOUR_GITHUB_USERNAME',
         repoName: 'QuizGame'
     };
     ```

4. **Optional: Create Issue Label**:
   - Go to repository Issues → Labels
   - Create a label called `question-report` (optional, for organization)

## GitLab OAuth Setup (for Private Question Packs)

To enable secure access to private question packs from GitLab:

1. **Create a GitLab OAuth Application**:
   - Go to your GitLab instance → User Settings → Applications
   - Create a new application with:
     - Name: Quiz Game
     - Redirect URI: `https://YOUR_USERNAME.github.io/QuizGame/oauth-callback.html`
     - Scopes: `read_api`, `read_repository`
   - Copy the Application ID

2. **Configure the Quiz Game**:
   - Edit `index.html`
   - Update `window.quizConfig.gitlab` with your GitLab details:
     ```javascript
     gitlab: {
         url: 'https://gitlab.example.com',
         oauthAppId: 'YOUR_OAUTH_APP_ID',
         defaultRepo: 'username/repo-name'
     }
     ```

3. **Set Up Private Question Pack Repository**:
   - Create a private GitLab repository for your question packs
   - Add question pack JSON files (see `ARCHITECTURE.md` for format)
   - Add team members with at least Reporter access
   - See `quiz-packs-private/README.md` for detailed instructions

For more details, see the [ARCHITECTURE.md](./ARCHITECTURE.md) file.

The quiz will be available at: `https://YOUR_USERNAME.github.io/QuizGame/`

## Project Structure

```
QuizGame/
├── index.html                 # Main entry point
├── README.md                  # This file
├── ARCHITECTURE.md            # Detailed architecture documentation
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
└── docs/
```

## License

TBD

