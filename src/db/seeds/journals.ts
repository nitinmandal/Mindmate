import { db } from '@/db';
import { user, journals } from '@/db/schema';

async function main() {
    // Check if users exist
    const existingUsers = await db.select({ id: user.id }).from(user);
    
    if (existingUsers.length === 0) {
        console.log('⚠️  Warning: No users found in database. Please seed users first before seeding journals.');
        return;
    }

    console.log(`Found ${existingUsers.length} users. Proceeding with journal seeding...`);

    // Distribute journal entries across available users
    const userIds = existingUsers.map(u => u.id);
    
    const now = new Date();
    const getDateDaysAgo = (days: number) => {
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        return date;
    };

    const sampleJournals = [
        {
            userId: userIds[0 % userIds.length],
            title: 'Morning Reflections',
            content: 'Woke up feeling more energized today. I practiced my morning meditation routine and noticed my mind was less cluttered than usual. The breathing exercises are really starting to make a difference in how I approach the day. I want to keep building on this momentum and stay consistent with my self-care practices.',
            createdAt: getDateDaysAgo(28),
            updatedAt: getDateDaysAgo(28),
        },
        {
            userId: userIds[1 % userIds.length],
            title: 'Therapy Session Notes',
            content: 'Today\'s therapy session was eye-opening. We explored the root causes of my stress and identified some unhealthy thought patterns I\'ve been repeating. My therapist gave me homework to challenge negative self-talk this week. I need to write down three positive affirmations each morning and notice when I\'m being overly critical of myself.',
            createdAt: getDateDaysAgo(25),
            updatedAt: getDateDaysAgo(25),
        },
        {
            userId: userIds[0 % userIds.length],
            title: 'Gratitude Practice',
            content: 'Grateful for small wins today - I got out of bed on time, made a healthy breakfast, and went for a walk. Depression makes these simple tasks feel monumental, so I\'m celebrating them. My therapist reminded me that progress isn\'t linear, and acknowledging these victories is part of healing. Today was a good day.',
            createdAt: getDateDaysAgo(20),
            updatedAt: getDateDaysAgo(20),
        },
        {
            userId: userIds[2 % userIds.length],
            title: 'Anxiety Management',
            content: 'Today I practiced the breathing exercises my therapist taught me. When I felt anxiety rising during the team meeting, I took five deep breaths and focused on the present moment. It really helped calm my racing thoughts. I also used the grounding technique - naming five things I could see, four I could touch, three I could hear. Feeling proud of how I handled it.',
            createdAt: getDateDaysAgo(18),
            updatedAt: getDateDaysAgo(18),
        },
        {
            userId: userIds[1 % userIds.length],
            title: 'Mindfulness Journey',
            content: 'Spent 20 minutes in mindful meditation today. I noticed how my thoughts kept wandering to work stress, but instead of fighting it, I just observed them and let them pass. This practice of non-judgment is harder than it sounds. My therapist says it\'s like training a muscle - it gets easier with time. I\'m committed to doing this daily.',
            createdAt: getDateDaysAgo(14),
            updatedAt: getDateDaysAgo(14),
        },
        {
            userId: userIds[2 % userIds.length],
            title: 'Progress Check-In',
            content: 'Looking back at where I was three months ago, I can see real progress. My panic attacks have decreased significantly, and I\'m sleeping better. The combination of therapy, medication, and lifestyle changes is working. Still have rough days, but they\'re becoming less frequent. I\'m learning to be patient with myself and trust the process.',
            createdAt: getDateDaysAgo(10),
            updatedAt: getDateDaysAgo(10),
        },
        {
            userId: userIds[0 % userIds.length],
            title: 'Daily Reflection',
            content: 'Had a difficult day emotionally. Old triggers came up and I found myself falling into familiar negative patterns. But this time, I caught myself sooner and used my coping strategies. Called my support person instead of isolating. Journaling about it now helps me process what happened. Tomorrow is a new day, and I\'m doing my best.',
            createdAt: getDateDaysAgo(5),
            updatedAt: getDateDaysAgo(5),
        },
        {
            userId: userIds[1 % userIds.length],
            title: 'Self-Care Reminder',
            content: 'Reminder to myself: taking breaks is not laziness, it\'s necessary. I spent the afternoon reading a book and taking a bath instead of forcing productivity. My body needed rest, and my mind needed quiet. Self-care isn\'t selfish - it\'s how I recharge and show up better for myself and others. Learning to honor my needs without guilt.',
            createdAt: getDateDaysAgo(2),
            updatedAt: getDateDaysAgo(2),
        },
    ];

    await db.insert(journals).values(sampleJournals);
    
    console.log('✅ Journals seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});