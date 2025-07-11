// src/pages/Auth/Recuperar.jsx
import React, { useState, useRef } from "react";
import { FiMail } from "react-icons/fi";
import { Link } from "react-router-dom";
import recoverImage from "../../assets/inicio.jpg";
import "./Auth.css";
import api from "../../api/api"; // Asegúrate de tenerlo apuntando a tu backend

export default function Recuperar() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // Paso 1: email, paso 2: código
  const [code, setCode] = useState(["", "", "", ""]);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

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
            {step === 1
              ? "Ingresa tu correo electrónico para enviar un código de verificación"
              : "Ingresa el código de 4 dígitos enviado a tu correo"}
          </p>
        </div>

        {error && <div className="error-message global-error">{error}</div>}
        {message && <div className="info-message global-info">{message}</div>}

        <form
          onSubmit={step === 1 ? handleSendCode : (e) => e.preventDefault()}
          className="form-body"
        >
          {step === 1 ? (
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
          ) : (
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

          <button type="submit" className="auth-button">
            {step === 1 ? "Enviar código" : "Verificar código"}
          </button>
        </form>

        <div className="form-footer">
          <p>
            ¿Recordaste tu contraseña?
            <Link to="/login" className="switch-link">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
