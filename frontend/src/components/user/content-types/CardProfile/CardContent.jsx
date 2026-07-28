import "./CardContent.css";
import MediaKosong from "../../../common/MediaKosong";

const CardContent = ({
  name = "Arif Ahmad Muzakky",
  role = "UI/UX Desain",
  quote = "“Programmer Full Stuck bukan Full Stack”",
  imageSrc = null,
}) => {
  return (
    <div className="card-profile">
      {/* Elemen baru untuk efek kilau saat hover */}
      <div className="card-light-sweep"></div>

      <div className="profile-frame">
        {imageSrc ? (
          <img src={imageSrc} alt={`Profil ${name}`} loading="lazy" decoding="async" />
        ) : (
          <MediaKosong fill label={`Foto profil ${name} belum tersedia`} />
        )}
      </div>

      <div className="card-text">
        <div className="name">
          <span>{name}</span>
        </div>
        <p className="role">{role}</p>
        <div className="card-divider"></div>
        <p className="quote">{quote}</p>
      </div>

      <div className="wave-shadow-wrapper">
        <div className="wave-content-container">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
          <div className="orb orb-4"></div>
          <div className="orb orb-bwh1"></div>
          <div className="orb orb-bwh2"></div>
          <div className="orb orb-bwh3"></div>
          <div className="orb orb-bwh4"></div>
          <div className="orb orb-7"></div>
        </div>
      </div>
    </div>
  );
};

export default CardContent;
