# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e7]
      - heading "Laboratorio Franz" [level=1] [ref=e9]
      - paragraph [ref=e10]: Bienvenido de vuelta
    - generic [ref=e11]:
      - generic [ref=e12]:
        - heading "Iniciar Sesión" [level=3] [ref=e13]
        - paragraph [ref=e14]: Ingresa tu cédula o correo electrónico
      - generic [ref=e16]:
        - generic [ref=e17]: Error al iniciar sesión. Por favor intenta de nuevo.
        - generic [ref=e18]:
          - text: Cédula o Correo Electrónico
          - textbox "Cédula o Correo Electrónico" [ref=e19]:
            - /placeholder: 1234567890 o correo@example.com
            - text: admin@lab.com
        - generic [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]: Contraseña
            - link "¿Olvidaste tu contraseña?" [ref=e23] [cursor=pointer]:
              - /url: /auth/forgot-password
          - textbox "Contraseña" [ref=e24]:
            - /placeholder: ••••••••
            - text: admin123
        - button "Iniciar Sesión" [ref=e25] [cursor=pointer]
        - generic [ref=e26]:
          - text: ¿No tienes una cuenta?
          - link "Regístrate aquí" [ref=e27] [cursor=pointer]:
            - /url: /auth/register
    - paragraph [ref=e28]: © 2025 Laboratorio Clínico Franz. Todos los derechos reservados.
  - button [ref=e30] [cursor=pointer]:
    - img [ref=e31]
  - alert [ref=e33]
```