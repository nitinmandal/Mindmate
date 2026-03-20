import { db } from '@/db';
import { posts, user } from '@/db/schema';

async function main() {
    // First, check if users exist
    const users = await db.select().from(user).limit(5);
    
    if (users.length === 0) {
        console.log('⚠️ Cannot seed posts: No users exist. Posts require valid user IDs. Please create users first via authentication.');
        return;
    }
    
    console.log(`✓ Found ${users.length} users. Proceeding with posts seeding...`);
    
    // Get user IDs for distribution
    const userIds = users.map(u => u.id);
    
    const samplePosts = [
        {
            userId: userIds[0],
            content: 'Today was really tough. I had a panic attack at work and had to leave early. Feeling embarrassed but trying to remind myself that it\'s okay to not be okay. Has anyone else dealt with workplace anxiety? How did you handle it?',
            category: 'share_feelings',
            isAnonymous: true,
            likesCount: 23,
            commentsCount: 8,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).getTime(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).getTime(),
        },
        {
            userId: userIds[1 % userIds.length],
            content: 'Small win today: I actually got out of bed before noon and made myself breakfast. It might not sound like much, but when you\'re battling depression, these little victories matter. Proud of myself for showing up today.',
            category: 'mental_growth',
            isAnonymous: false,
            likesCount: 45,
            commentsCount: 12,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).getTime(),
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).getTime(),
        },
        {
            userId: userIds[2 % userIds.length],
            content: 'To anyone struggling right now: You are stronger than you think. Your mental health journey is valid, and you deserve support and compassion. Take it one day at a time, one hour at a time if needed. You\'re not alone in this.',
            category: 'support_encouragement',
            isAnonymous: false,
            likesCount: 38,
            commentsCount: 15,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime(),
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime(),
        },
        {
            userId: userIds[0],
            content: 'Started therapy three months ago and it\'s been life-changing. My therapist helped me understand that my overthinking isn\'t a character flaw - it\'s something I can work on. If you\'re on the fence about therapy, this is your sign to try it.',
            category: 'mental_growth',
            isAnonymous: false,
            likesCount: 31,
            commentsCount: 9,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).getTime(),
            updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).getTime(),
        },
        {
            userId: userIds[3 % userIds.length],
            content: 'I\'ve been isolating myself for weeks. My friends keep reaching out but I push them away. I know I need connection but the thought of interacting with people feels exhausting. Anyone else experience this? How do you break the cycle?',
            category: 'share_feelings',
            isAnonymous: true,
            likesCount: 27,
            commentsCount: 11,
            createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).getTime(),
            updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).getTime(),
        },
        {
            userId: userIds[1 % userIds.length],
            content: 'Reminder: Healing isn\'t linear. Some days will be harder than others, and that\'s completely normal. Progress isn\'t about never having bad days - it\'s about how you navigate through them. Be patient and kind to yourself.',
            category: 'support_encouragement',
            isAnonymous: false,
            likesCount: 42,
            commentsCount: 7,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).getTime(),
            updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).getTime(),
        },
        {
            userId: userIds[4 % userIds.length],
            content: 'My anxiety has been through the roof lately. Can\'t sleep, constant worry about everything. Started journaling before bed and it\'s helping a bit. What are some coping strategies that work for you when anxiety feels overwhelming?',
            category: 'share_feelings',
            isAnonymous: true,
            likesCount: 19,
            commentsCount: 14,
            createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).getTime(),
            updatedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).getTime(),
        },
        {
            userId: userIds[2 % userIds.length],
            content: 'I finally set boundaries with my family about my mental health needs. It was scary but necessary. Learning to prioritize yourself isn\'t selfish - it\'s essential. Your mental health matters, and you don\'t owe anyone an explanation for protecting it.',
            category: 'mental_growth',
            isAnonymous: false,
            likesCount: 36,
            commentsCount: 10,
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).getTime(),
            updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).getTime(),
        },
        {
            userId: userIds[0],
            content: 'Having a rough day and that\'s okay. Sometimes we need to sit with uncomfortable feelings instead of running from them. Sending strength to everyone who\'s fighting battles no one else can see. You\'re doing better than you think.',
            category: 'support_encouragement',
            isAnonymous: false,
            likesCount: 29,
            commentsCount: 6,
            createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).getTime(),
            updatedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).getTime(),
        },
        {
            userId: userIds[3 % userIds.length],
            content: 'Been dealing with imposter syndrome at my new job. Every achievement feels like luck rather than skill. My therapist says this is common but it doesn\'t make it easier. Does anyone have tips for managing these feelings of inadequacy?',
            category: 'share_feelings',
            isAnonymous: true,
            likesCount: 33,
            commentsCount: 13,
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).getTime(),
            updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).getTime(),
        },
    ];
    
    await db.insert(posts).values(samplePosts);
    
    console.log('✅ Posts seeder completed successfully - 10 posts created');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});