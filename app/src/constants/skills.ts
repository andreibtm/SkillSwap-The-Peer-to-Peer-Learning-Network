export const AVAILABLE_SKILLS = Array.from(new Set([
  // Programming & Tech
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin',
  'Go', 'Rust', 'Scala', 'R', 'MATLAB', 'Perl', 'Lua', 'Shell Scripting', 'PowerShell',
  'React', 'Angular', 'Vue.js', 'Node.js', 'Django', 'Flask', 'Spring Boot', 'Laravel',
  'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Unity', 'Unreal Engine', 'Godot',
  'Game Development', 'Web Development', 'Mobile App Development', 'Software Engineering',
  'Machine Learning', 'Artificial Intelligence', 'Deep Learning', 'Data Science', 'Data Analysis',
  'Big Data', 'Cloud Computing', 'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
  'DevOps', 'CI/CD', 'Microservices', 'Blockchain', 'Smart Contracts', 'Cybersecurity',
  'Ethical Hacking', 'Penetration Testing', 'Network Security', 'Database Management',
  'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Oracle', 'Redis', 'GraphQL', 'REST API',
  'UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Prototyping', 'Wireframing',
  'HTML', 'CSS', 'SASS', 'Tailwind CSS', 'Bootstrap', 'Material Design',
  'Git', 'GitHub', 'Version Control', 'Agile', 'Scrum', 'Jira', 'Project Management',
  'Linux', 'Unix', 'Windows Server', 'System Administration', 'Virtualization',
  'IoT', 'Raspberry Pi', 'Arduino', 'Electronics', 'Robotics', 'Automation',
  '3D Modeling', '3D Printing', 'CAD', 'AutoCAD', 'SolidWorks', 'Blender',
  
  // Sports & Fitness
  'Football', 'Basketball', 'Tennis', 'Volleyball', 'Baseball', 'Cricket', 'Rugby',
  'Soccer', 'Hockey', 'Swimming', 'Running', 'Jogging', 'Marathon Training', 'Sprinting',
  'Cycling', 'Mountain Biking', 'BMX', 'Skateboarding', 'Surfing', 'Snowboarding', 'Skiing',
  'Ice Skating', 'Roller Skating', 'Parkour', 'Rock Climbing', 'Bouldering', 'Mountaineering',
  'Hiking', 'Trail Running', 'Boxing', 'Kickboxing', 'MMA', 'Judo', 'Karate', 'Taekwondo',
  'Brazilian Jiu-Jitsu', 'Muay Thai', 'Wrestling', 'Fencing', 'Archery', 'Shooting',
  'Golf', 'Badminton', 'Table Tennis', 'Squash', 'Racquetball', 'Handball',
  'Water Polo', 'Rowing', 'Kayaking', 'Canoeing', 'Sailing', 'Windsurfing', 'Kitesurfing',
  'Diving', 'Scuba Diving', 'Snorkeling', 'Triathlon', 'Crossfit', 'Weightlifting',
  'Powerlifting', 'Bodybuilding', 'Calisthenics', 'Gymnastics', 'Yoga', 'Pilates',
  'Zumba', 'Aerobics', 'Dance Fitness', 'Stretching', 'Mobility Training',
  'Personal Training', 'Nutrition', 'Sports Nutrition', 'Meal Planning',
  
  // Music
  'Guitar', 'Electric Guitar', 'Bass Guitar', 'Acoustic Guitar', 'Piano', 'Keyboard',
  'Drums', 'Percussion', 'Violin', 'Cello', 'Viola', 'Double Bass', 'Ukulele',
  'Banjo', 'Mandolin', 'Harmonica', 'Saxophone', 'Trumpet', 'Trombone', 'Clarinet',
  'Flute', 'Oboe', 'Bassoon', 'French Horn', 'Tuba', 'Accordion', 'Bagpipes',
  'Singing', 'Vocal Training', 'Opera', 'Jazz Vocals', 'Choir', 'Beatboxing',
  'Music Production', 'Audio Engineering', 'Sound Design', 'Mixing', 'Mastering',
  'DJing', 'Electronic Music', 'Music Theory', 'Composition', 'Songwriting',
  'Music Arrangement', 'Orchestration', 'Conducting', 'Sight Reading',
  'Ableton Live', 'FL Studio', 'Logic Pro', 'Pro Tools', 'Cubase',
  
  // Arts & Crafts
  'Painting', 'Drawing', 'Sketching', 'Oil Painting', 'Watercolor', 'Acrylic Painting',
  'Digital Art', 'Illustration', 'Character Design', 'Concept Art', 'Cartoon Drawing',
  'Anime Art', 'Manga', 'Comic Books', 'Storyboarding', 'Calligraphy', 'Lettering',
  'Typography', 'Graphic Design', 'Logo Design', 'Brand Identity', 'Print Design',
  'Photography', 'Portrait Photography', 'Landscape Photography', 'Street Photography',
  'Wildlife Photography', 'Macro Photography', 'Product Photography', 'Food Photography',
  'Wedding Photography', 'Event Photography', 'Photo Editing', 'Lightroom', 'Photoshop',
  'Sculpture', 'Pottery', 'Ceramics', 'Glass Blowing', 'Metalworking', 'Jewelry Making',
  'Woodworking', 'Carpentry', 'Furniture Making', 'Wood Carving', 'Leatherworking',
  'Sewing', 'Knitting', 'Crocheting', 'Embroidery', 'Quilting', 'Tailoring',
  'Fashion Design', 'Pattern Making', 'Textile Design', 'Origami', 'Paper Crafts',
  'Scrapbooking', 'Card Making', 'Candle Making', 'Soap Making', 'Resin Art',
  
  // Performance Arts
  'Dancing', 'Ballet', 'Contemporary Dance', 'Hip Hop Dance', 'Jazz Dance', 'Tap Dance',
  'Ballroom Dancing', 'Salsa', 'Bachata', 'Tango', 'Waltz', 'Swing Dance', 'Folk Dance',
  'Belly Dancing', 'Flamenco', 'Irish Dance', 'Breakdancing', 'Pole Dancing',
  'Acting', 'Theater', 'Improvisation', 'Voice Acting', 'Stand-up Comedy', 'Comedy Writing',
  'Magic', 'Illusion', 'Card Tricks', 'Mentalism', 'Juggling', 'Circus Arts',
  'Acrobatics', 'Aerial Silks', 'Trapeze', 'Contortion', 'Mime', 'Puppetry',
  
  // Writing & Literature
  'Writing', 'Creative Writing', 'Fiction Writing', 'Non-Fiction Writing', 'Copywriting',
  'Content Writing', 'Technical Writing', 'Grant Writing', 'Resume Writing',
  'Poetry', 'Poems', 'Haiku', 'Screenwriting', 'Playwriting', 'Novel Writing',
  'Short Stories', 'Blog Writing', 'Journalism', 'News Writing', 'Editorial Writing',
  'Academic Writing', 'Essay Writing', 'Research Writing', 'Ghostwriting',
  'Translation', 'Proofreading', 'Editing', 'Publishing', 'Self-Publishing',
  
  // Languages
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
  'Chinese', 'Mandarin', 'Cantonese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
  'Bengali', 'Urdu', 'Turkish', 'Polish', 'Dutch', 'Swedish', 'Danish', 'Norwegian',
  'Finnish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian', 'Tagalog',
  'Swahili', 'Czech', 'Romanian', 'Hungarian', 'Sign Language', 'ASL',
  
  // Cooking & Culinary
  'Cooking', 'Baking', 'Pastry', 'Cake Decorating', 'Bread Making', 'Pizza Making',
  'Grilling', 'BBQ', 'Smoking Meats', 'Sous Vide', 'Meal Prep', 'Vegan Cooking',
  'Vegetarian Cooking', 'Gluten-Free Cooking', 'Asian Cuisine', 'Italian Cuisine',
  'French Cuisine', 'Mexican Cuisine', 'Indian Cuisine', 'Thai Cuisine', 'Sushi Making',
  'Chocolate Making', 'Candy Making', 'Ice Cream Making', 'Wine Pairing', 'Bartending',
  'Mixology', 'Coffee Brewing', 'Latte Art', 'Tea Ceremony', 'Knife Skills',
  'Food Styling', 'Molecular Gastronomy', 'Butchery', 'Cheese Making', 'Fermentation',
  
  // Business & Professional
  'Public Speaking', 'Presentation Skills', 'Negotiation', 'Sales', 'Cold Calling',
  'Marketing', 'Digital Marketing', 'Social Media Marketing', 'Email Marketing',
  'SEO', 'Content Marketing', 'Influencer Marketing', 'Affiliate Marketing',
  'Brand Management', 'Product Management', 'Business Strategy', 'Business Analysis',
  'Financial Analysis', 'Accounting', 'Bookkeeping', 'Excel', 'Financial Planning',
  'Investment', 'Stock Trading', 'Cryptocurrency', 'Real Estate', 'Property Management',
  'Entrepreneurship', 'Startup', 'Business Plan Writing', 'Fundraising', 'Pitching',
  'Leadership', 'Team Management', 'HR Management', 'Recruitment', 'Coaching',
  'Mentoring', 'Career Counseling', 'Life Coaching', 'Time Management', 'Productivity',
  'Customer Service', 'Conflict Resolution', 'Networking', 'Event Planning',
  
  // Science & Education
  'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Calculus', 'Statistics',
  'Algebra', 'Geometry', 'Trigonometry', 'Astronomy', 'Astrophysics', 'Geology',
  'Environmental Science', 'Marine Biology', 'Botany', 'Zoology', 'Anatomy',
  'Psychology', 'Neuroscience', 'Sociology', 'Anthropology', 'History', 'Philosophy',
  'Political Science', 'Economics', 'Geography', 'Archaeology', 'Forensics',
  'Tutoring', 'Teaching', 'Curriculum Development', 'Lesson Planning', 'E-Learning',
  
  // Games & Hobbies
  'Chess', 'Poker', 'Bridge', 'Backgammon', 'Go', 'Mahjong', 'Scrabble',
  'Video Gaming', 'Esports', 'Speedrunning', 'Board Games', 'Card Games',
  'Dungeon Master', 'RPG Games', 'Miniature Painting', 'Model Building',
  'Coin Collecting', 'Stamp Collecting', 'Bird Watching', 'Astronomy Observation',
  'Stargazing', 'Fishing', 'Fly Fishing', 'Hunting', 'Camping', 'Survival Skills',
  'Bushcraft', 'Foraging', 'Gardening', 'Organic Gardening', 'Hydroponics',
  'Beekeeping', 'Animal Training', 'Dog Training', 'Horse Riding', 'Horseback Riding',
  
  // Health & Wellness
  'Meditation', 'Mindfulness', 'Breathwork', 'Tai Chi', 'Qigong', 'Reiki',
  'Massage Therapy', 'Reflexology', 'Acupressure', 'Aromatherapy', 'Herbalism',
  'Holistic Health', 'Naturopathy', 'Homeopathy', 'First Aid', 'CPR',
  'Mental Health Awareness', 'Stress Management', 'Sleep Hygiene',
  
  // Other Skills
  'Video Editing', 'Adobe Premiere', 'Final Cut Pro', 'DaVinci Resolve', 'After Effects',
  'Animation', '2D Animation', '3D Animation', 'Stop Motion', 'Motion Graphics',
  'Podcasting', 'Audio Editing', 'Voice Over', 'Radio Broadcasting',
  'Film Making', 'Cinematography', 'Directing', 'Producing',
  'Interior Design', 'Architecture', 'Landscape Design', 'Urban Planning',
  'Fashion Styling', 'Makeup Artistry', 'Hair Styling', 'Nail Art', 'Skincare',
  'Barber', 'Tattooing', 'Body Piercing', 'Automotive Repair', 'Motorcycle Repair',
  'Bicycle Repair', 'Plumbing', 'Electrical Work', 'HVAC', 'Welding',
  'Lock Picking', 'Home Improvement', 'DIY Projects', 'Upcycling', 'Recycling Crafts'
])).sort();
