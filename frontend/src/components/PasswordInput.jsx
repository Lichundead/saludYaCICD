import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Campo de contraseña con botón para revelar/ocultar el texto.
 * Acepta las mismas props que un <input> (name, value, onChange, placeholder...).
 */
function PasswordInput({ ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="password-field__toggle"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default PasswordInput;
