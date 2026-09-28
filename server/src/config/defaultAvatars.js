const DEFAULT_AVATARS = {
    male: [
        "https://res.cloudinary.com/dsm8fij3s/image/upload/v1790506047/avatar_male_1.png",
        "https://res.cloudinary.com/dsm8fij3s/image/upload/v1790506047/avatar_male_2.png",
        "https://res.cloudinary.com/dsm8fij3s/image/upload/v1790506047/avatar_male_3.png",
        "https://res.cloudinary.com/dsm8fij3s/image/upload/v1790506047/avatar_male_4.png",
        "https://res.cloudinary.com/dsm8fij3s/image/upload/v1790506047/avatar_male_5.png",
    ],
    female: [
        "https://res.cloudinary.com/dsm8fij3s/image/upload/v1790506046/avatar_female_1.png",
        "https://res.cloudinary.com/dsm8fij3s/image/upload/v1790506046/avatar_female_2.png",
        "https://res.cloudinary.com/dsm8fij3s/image/upload/v1790506046/avatar_female_3.png",
        "https://res.cloudinary.com/dsm8fij3s/image/upload/v1790506046/avatar_female_4.png",
        "https://res.cloudinary.com/dsm8fij3s/image/upload/v1790506046/avatar_female_5.png",
    ],
};

export const getRandomDefaultAvatar = (gender) => {
    const avatars = DEFAULT_AVATARS[gender];

    if (!avatars?.length) {
        return null;
    }

    return avatars[Math.floor(Math.random() * avatars.length)];
};

export const hasDefaultAvatarsConfigured = (gender) => {
    return Boolean(DEFAULT_AVATARS[gender]?.length);
};
