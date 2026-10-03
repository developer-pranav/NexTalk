const NexTalkLogo = ({ size = 42, className = "" }) => {
    return (
        <img
            src="/icon.png"
            alt="NexTalk"
            width={size}
            height={size}
            className={`object-contain ${className}`}
            draggable="false"
        />
    );
};

export default NexTalkLogo;