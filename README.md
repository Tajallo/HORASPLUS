Gestor de Horas Extra
Aplicación para gestionar y calcular horas extra trabajadas.

Instalación
Clona el repositorio:
git clone https://github.com/TU_USUARIO/nombre-del-repo.git

Navega al directorio del proyecto:
cd nombre-del-repo

Instala las dependencias:
npm install

Inicia el servidor de desarrollo:
npm run dev

Accede a la aplicación en http://localhost:3000

## Ejecutar con Docker

### Prerrequisitos
- Docker
- Docker Compose

### Pasos
1. Clona el repositorio (si no lo has hecho ya):
2. Navega al directorio del proyecto:
3. Construye y ejecuta los contenedores: docker-compose up --build
4. Accede a la aplicación en http://localhost:3000
Para ver los logs: docker-compose logs -f



## Características
- Registro de horas extra trabajadas
- Cálculo automático de horas compensables
- Filtrado por meses
- Persistencia de datos
- Interfaz responsive

## Tecnologías utilizadas
- React
- Tailwind CSS
- JSON Server
- Docker