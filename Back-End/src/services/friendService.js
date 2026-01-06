const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const addFriend = async (userId, friendId) => {
    try {
        // Create a friendship relation
        const friendship = await prisma.user.update({
            where: { id: userId },
            data: {
                friends: {
                    connect: { id: friendId },
                },
            },
        });

        return friendship;
    } catch (error) {
        throw new Error('Failed to add friend: ' + error.message);
    }
};

const getFriends = async (userId) => {
    try {
        // Retrieve the user's friends
        const userWithFriends = await prisma.user.findUnique({
            where: { id: userId },
            include: { friends: true },
        });

        if (!userWithFriends) {
            throw new Error('User not found');
        }

        return userWithFriends.friends;
    } catch (error) {
        throw new Error('Failed to retrieve friends: ' + error.message);
    }
};

module.exports = { addFriend, getFriends };