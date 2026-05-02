import db from '../src/models/index.js';
import bcrypt from 'bcrypt';

const categories = [
    'development',
    'design',
    'marketing'
];

const locations = ['Remote', 'Ethiopia', 'Germany', 'USA', 'Canada', 'UK', 'Estonia'];

const skillPool = {
    'development': ['Solidity', 'Rust', 'Web3.js', 'Ethers.js', 'Smart Contracts', 'Hardhat', 'Truffle', 'React', 'Node.js', 'Python', 'Go', 'TypeScript', 'Java', 'Next.js', 'Docker'],
    'design': ['Figma', 'Adobe XD', 'Photoshop', 'UI/UX', 'Illustrator', 'Motion Design'],
    'marketing': ['SEO', 'Content Strategy', 'Social Media', 'PPC', 'Analytics', 'Brand Identity']
};

function rand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomSkills(category, count) {
    const pool = skillPool[category] || skillPool['development'];
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

async function seed() {
    console.log('Starting seed process...');
    try {
        const saltRounds = 10;
        const passHash = await bcrypt.hash('1234Aa', saltRounds);
        const timestamp = Date.now();

        for (let i = 1; i <= 50; i++) {
            const fName = `Freelancer${i}`;
            const lName = `Test${i}`;
            const category = rand(categories);
            const location = rand(locations);
            const minWage = randInt(20, 150);
            const skills = getRandomSkills(category, randInt(3, 5));

            // 1. Insert User
            const [userResult] = await db.query(
                `INSERT INTO users (f_name, l_name, email, pass_hash, bio, location, profile_picture, role)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    fName,
                    lName,
                    `user${i}_${timestamp}@example.test`,
                    passHash,
                    `Passionate ${category} expert from ${location} with over ${randInt(2, 10)} years of experience.`,
                    location,
                    null, // Profile picture
                    'freelancer'
                ]
            );

            const userId = userResult.insertId;

            // 2. Insert Freelancer
            await db.query(
                `INSERT INTO freelancers (user_id, title, category, description, min_wage, skills, qualifications)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    `${category} Specialist`,
                    category,
                    `I am a professional ${category} with a focus on high-quality delivery and client satisfaction. I have worked on numerous projects involving ${skills.join(', ')}.`,
                    minWage,
                    JSON.stringify(skills),
                    JSON.stringify([{ title: 'Professional Certification', issuer: 'Seed Authority', year: 2024 }])
                ]
            );

            // 3. Insert Contacts
            await db.query(
                `INSERT INTO contacts (user_id, website, github, linkedin, twitter, instagram, telegram, whatsapp)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    `https://user${i}.test`,
                    `github.com/user${i}`,
                    `linkedin.com/in/user${i}`,
                    `twitter.com/user${i}`,
                    null,
                    `t.me/user${i}`,
                    `+12345678${i}`
                ]
            );

            // 4. Insert Education
            await db.query(
                `INSERT INTO education_levels (user_id, title, institution, start_year, end_year)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    userId,
                    'Bachelor of Science',
                    'University of Technology',
                    2015,
                    2019
                ]
            );

            // 5. Insert Certifications
            await db.query(
                `INSERT INTO certifications (user_id, title, issuer, year)
                 VALUES (?, ?, ?, ?)`,
                [
                    userId,
                    `Certified ${category} Professional`,
                    'Certification Board',
                    2022
                ]
            );

            if (i % 10 === 0) console.log(`Seeded ${i} freelancers...`);
        }

        console.log('Seed complete successfully!');
    } catch (error) {
        console.error('Error during seeding:', error);
    } finally {
        process.exit();
    }
}

seed();
