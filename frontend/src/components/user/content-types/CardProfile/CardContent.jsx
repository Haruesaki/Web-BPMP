import "./CardContent.css";
import WOWOK from "../../../../assets/source/FotoFormal.jpg";

const CardContent = ({
  name = "Arif Ahmad Muzakky",
  role = "UI/UX Desain",
  quote = "“Programmer Full Stuck bukan Full Stack”",
  imageSrc = WOWOK,
}) => {
  return (
    <div className="card-profile">
      {/* Elemen baru untuk efek kilau saat hover */}
      <div className="card-light-sweep"></div>

      <div className="profile-frame">
        <img src={imageSrc} alt={`Profil ${name}`} />
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
        {/* Latar belakang solid dengan efek gelombang dari mask-image */}
        <div className="wave-content-container"></div>
      </div>
    </div>
  );
};

export default CardContent;
