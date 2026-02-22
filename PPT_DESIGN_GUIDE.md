# Restaurant App - PPT Design Guidelines

## Color Scheme (Recommended)
```
Primary Color:    #1D4ED8 (Blue)
Secondary Color:  #DC2626 (Red)
Accent Color:     #059669 (Green)
Background:       #FFFFFF (White)
Dark Text:        #1F2937 (Dark Gray)
Light Text:       #6B7280 (Medium Gray)
```

## Slide Design Templates

### Template 1: Title Slide
```
╔════════════════════════════════════════════════════╗
║                                                    ║
║          Restaurant App                           ║
║          Full-Stack Web Application                ║
║                                                    ║
║          React • Node.js • PostgreSQL             ║
║                                                    ║
║          februarie 2026                            ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

### Template 2: Content Slide with Code
```
╔════════════════════════════════════════════════════╗
║  Title: [Slide Title]                             ║
║  ────────────────────────────────────────────────  ║
║                                                    ║
║  📌 Key Point 1                                   ║
║  📌 Key Point 2                                   ║
║  📌 Key Point 3                                   ║
║                                                    ║
║  Code Example:                                    ║
║  ┌──────────────────────────────────────────┐    ║
║  │ javascript code with syntax highlighting│    ║
║  │ ...                                      │    ║
║  └──────────────────────────────────────────┘    ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

### Template 3: Two Column Slide
```
╔════════════════════════════════════════════════════╗
║  Title: [Slide Title]                             ║
║  ────────────────────────────────────────────────  ║
║                                                    ║
║  Left Column:          Right Column:              ║
║  • Point 1             • Point 1                  ║
║  • Point 2             • Point 2                  ║
║  • Point 3             • Point 3                  ║
║                                                    ║
║  [Diagram]             [Screenshot/Image]         ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

## Key Visuals to Include

### Slide 3: Architecture Diagram
Create using: Draw.io, Lucidchart, or PowerPoint shapes
- Show: Frontend → API → Backend → Database
- Use arrows to show data flow
- Color code: Frontend (Blue), Backend (Green), Database (Red)

### Slide 4: Folder Structure
Use monospace font (Courier New) for folder tree
Highlight key files with different colors

### Slide 9: Database Schema
```
Products Table:
┌─────────────────────────────────┐
│ id (PK)                         │
│ name (VARCHAR 100)              │
│ price (DECIMAL 10,2)            │
│ description (TEXT)              │
│ stock (INTEGER)                 │
│ category (VARCHAR)              │
│ imagePath (VARCHAR 255) ← NEW   │
│ createdAt (TIMESTAMP)           │
│ updatedAt (TIMESTAMP)           │
└─────────────────────────────────┘
```

### Slide 12: API Endpoints Table
Create a formatted table with:
- Method (GET/POST/PUT/DELETE)
- Endpoint path
- Description
- Required Auth (Yes/No)

Color code by method:
- GET = Blue
- POST = Green
- PUT = Orange
- DELETE = Red

## Recommended Fonts
- **Titles:** Segoe UI Bold, 40-44pt
- **Subtitles:** Segoe UI, 24-28pt
- **Body Text:** Segoe UI, 18-20pt
- **Code:** Courier New or Monaco, 12-14pt (monospace)

## Slide-by-Slide Visual Recommendations

1. **Slide 1 (Cover):** Add logo/brand image, keep simple and clean
2. **Slide 2 (Overview):** 3-4 feature icons, brief descriptions
3. **Slide 3 (Architecture):** System diagram with arrows
4. **Slide 4 (Frontend Stack):** Folder tree structure, logos of libraries
5. **Slide 5 (Auth):** Code snippet with visual hierarchy
6. **Slide 6 (Cart):** Code + simple state diagram
7. **Slide 7 (Admin Features):** Screenshot of image upload UI + code
8. **Slide 8 (Backend Stack):** Folder structure + library logos
9. **Slide 9 (Database):** Schema diagram with data types highlighted
10. **Slide 10 (Multer):** Step-by-step upload flow diagram + code
11. **Slide 11 (Update):** Before/After image replacement flow
12. **Slide 12 (API):** Endpoint table, REST verb colors
13. **Slide 13 (Security):** Middleware stack diagram + authentication flow
14. **Slide 14 (Lessons):** Key takeaways in bold text, comparison tables
15. **Slide 15 (Demo):** Screenshots of each feature being demoed

## Code Snippet Best Practices

### Highlighting Key Lines in Code:
```javascript
// GOOD - Use yellow highlight for key line
router.post('/create',
  ✨ upload.single('image')(req, res, async (err) => {  ← Highlight
    if (err) return res.status(400).json(...)
    // ... rest of code
  })
// BAD - Don't highlight everything, be selective
```

### Use These Annotations:
```
✅ CORRECT        - Green checkmark
❌ WRONG          - Red X
⚠️  WARNING        - Yellow warning
💡 TIP             - Blue lightbulb
🔧 FIX             - Orange wrench
📌 IMPORTANT       - Red pin
```

## Transitions
- **Between slides:** Fade or Push (not too flashy)
- **Code reveals:** Appear by line (helps follow along)
- **Diagrams:** Animate arrows one by one (shows data flow)

## Speaker Notes Template

For each code slide, add notes:
```
Speaker Notes:
- Point out the validate middleware
- Explain why we use FormData instead of JSON
- Mention the 5MB file size limit
- Show how old image gets deleted
- Ask: "Any questions about file uploads?"
```

## Demo Script

```
SLIDE 15 DEMO SCRIPT:

1. "First, let me show the Home Page..." 
   [Open http://localhost:5174]
   - Scroll down, show featured products
   - Mention: "Images are served from backend"

2. "Now let's go to the Menu page..."
   [Click Menu]
   - Use filters: "Filter by Pizza category"
   - Show how products have images
   - Click "View" on a product

3. "Here's the product detail page..."
   - Show image, description, reviews
   - Mention: getImageUrl() helper function
   - Add to cart: show shopping cart update

4. "Let me login as admin..."
   [Logout, login as admin@restaurant.local]
   - Navigate to Admin panel
   - Click "Create Product"
   - Upload an image file
   - Show preview
   - Click Create

5. "Now let's edit a product..."
   [Go to Menu]
   - Click "Modifică" (Edit) button
   - Change image
   - Mention old image gets deleted
   - Click Save

6. "Finally, let's check the cart..."
   [Go to Cart]
   - Show items with images
   - Demonstrate quantity change
   - Show total calculation
```

## File Size & Format Tips
- **Presentation File:** .pptx (Office format, best compatibility)
- **Images:** Use PNG/JPG, max 1920x1080 resolution
- **File Size:** Keep under 100MB total
- **Export:** For online sharing, export as PDF or video

## Accessibility Checklist
- ✅ Font size at least 18pt for readability
- ✅ High contrast between text and background
- ✅ Alt-text for all images
- ✅ Don't rely on color alone (use text labels too)
- ✅ Minimize animation (can distract or trigger motion sickness)

## Timing Guide
```
Slide 1  (Cover):         1 min
Slide 2  (Overview):      2 min
Slide 3  (Architecture):  2 min
Slide 4  (Frontend Stack): 2 min
Slide 5  (Auth):          2 min
Slide 6  (Cart):          2 min
Slide 7  (Admin Features): 2 min
Slide 8  (Backend Stack): 2 min
Slide 9  (Database):      1 min
Slide 10 (Multer):        3 min (code explanation)
Slide 11 (Update):        2 min
Slide 12 (API):           2 min
Slide 13 (Security):      2 min
Slide 14 (Lessons):       3 min (discuss challenges)
Slide 15 (Demo + Q&A):    10 min

TOTAL: 35-40 minutes ✓
```
