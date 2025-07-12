import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import authService from "../../services/authService";

export default function AccountActivation() {
  const { token } = useParams();
  const [status, setStatus] = useState("Verificando...");
  const navigate = useNavigate();

  useEffect(() => {
    const activate = async () => {
      try {
        const res = await authService.activarCuenta(token);
        if (res.success) {
          setStatus("¡Tu cuenta ha sido activada! Puedes iniciar sesión.");
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setStatus("No se pudo activar la cuenta.");
        }
      } catch (err) {
        setStatus("Token inválido o expirado.");
      }
    };

    activate();
  }, [token, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Activación de Cuenta</h2>
        <p>{status}</p>
      </div>
    </div>
  );
}
