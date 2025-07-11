import React, { useState, useRef } from "react";
import { FiMail, FiLock } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import recoverImage from "../../assets/inicio.jpg";
import "./Auth.css";
import api from "../../api/api";

export default function Recuperar() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: email, 2: código, 3: nueva contraseña
  const [code, setCode] = useState(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const response = await api.post("/auth/send-code", { email });

      if (response.data.success) {
        setMessage("Código enviado a tu correo.");
        setStep(2);
      } else {
        setError("Correo no encontrado.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error al enviar el código.");
    }
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const recoveryCode = code.join("");

    if (recoveryCode.length !== 4) {
      setError("Ingresa el código completo de 4 dígitos.");
      return;
    }

    try {
      const response = await api.post("/auth/verificar-codigo", {
        email,
        codigo: recoveryCode,
      });

      if (response.data.success) {
        setMessage("Código verificado. Ingresa tu nueva contraseña.");
        setStep(3);
      } else {
        setError("Código inválido o expirado.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error al verificar el código.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const response = await api.post("/auth/reset-password", {
        email,
        nuevaContrasena: newPassword,
      });

      if (response.data.success) {
        setMessage("Contraseña restablecida correctamente. Redirigiendo...");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        setError("No se pudo restablecer la contraseña.");
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "Error al restablecer la contraseña."
      );
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image">
        <img src={recoverImage} alt="Recuperar contraseña" />
      </div>
      <div className="divider-line"></div>
      <div className="auth-form">
        <div className="form-header">
          <h2>Recuperar Contraseña</h2>
          <p>
            {step === 1 &&
              "Ingresa tu correo electrónico para enviar un código de verificación"}
            {step === 2 && "Ingresa el código de 4 dígitos enviado a tu correo"}
            {step === 3 && "Ingresa tu nueva contraseña"}
          </p>
        </div>

        {error && <div className="error-message global-error">{error}</div>}
        {message && <div className="info-message global-info">{message}</div>}

        <form
          onSubmit={
            step === 1
              ? handleSendCode
              : step === 2
              ? handleVerifyCode
              : handleResetPassword
          }
          className="form-body"
        >
          {step === 1 && (
            <div className="input-group">
              <div className="input-container">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="input-field"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="input-group code-group">
              {code.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  ref={inputRefs[index]}
                  className="code-input"
                />
              ))}
            </div>
          )}

          {step === 3 && (
            <>
              <div className="input-group">
                <div className="input-container">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Nueva contraseña"
                    className={`input-field ${error ? "input-error" : ""}`}
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="input-container">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirmar contraseña"
                    className={`input-field ${error ? "input-error" : ""}`}
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="auth-button">
            {step === 1
              ? "Enviar código"
              : step === 2
              ? "Verificar código"
              : "Restablecer contraseña"}
          </button>
        </form>

        <div className="form-footer">
          <p>
            ¿Recordaste tu contraseña?{" "}
            <Link to="/login" className="switch-link">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
