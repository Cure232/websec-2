import Container from '../layout/Container';

export default function AboutPage() {
  return (
    <Container>
      <article className="about-page">
        <h2>О лабораторной работе</h2>
        <p>
          Это лабораторная работа №2 по дисциплине «Безопасность веб-приложений». По варианту 2
          реализован веб-аналог «Прибывалки» для электричек: поиск станций, просмотр расписания по
          станции, выбор любимых станций, просмотр маршрутов проходящих между станций и через станции и адаптация интерфейса под мобильные устройства.
        </p>

        <section className="about-section">
          <h3>Что реализовано</h3>
          <ul>
            <li>Поиск железнодорожных станций по названию и выбор станций на карте.</li>
            <li>Просмотр расписания всех проходящих через выбранную станцию поездов.</li>
            <li>Поиск маршрутов между станций и через станции.</li>
            <li>Избранные станции с сохранением в localStorage.</li>
            <li>Адаптивный интерфейс для смартфонов и десктопа.</li>
          </ul>
        </section>

        <section className="about-section">
          <h3>Технологии</h3>
          <ul>
            <li>Frontend: React, Vite, React Router, React Leaflet, CSS.</li>
            <li>Backend: Node.js, Express, Axios, CORS, dotenv.</li>
            <li>Внешний источник данных: API Яндекс.Расписаний.</li>
            <li>Пакетный менеджер: npm.</li>
          </ul>
        </section>

        <section className="about-section">
          <h3>Как запустить проект</h3>
          <ol>
            <li>Установите зависимости для backend: npm install в папке backend.</li>
            <li>
              Создайте файл backend/.env и добавьте ключ: YANDEX_RASP_API_KEY=*ваш_ключ*. При
              необходимости добавьте PORT=5000.
            </li>
            <li>Запустите backend: npm run dev.</li>
            <li>Установите зависимости для frontend: npm install в папке frontend.</li>
            <li>Запустите frontend: npm dev.</li>
            <li>Откройте адрес из вывода Vite в браузере (обычно http://localhost:5173).</li>
          </ol>
        </section>

        <section className="about-section">
          <h3>Структура приложения</h3>
          <ul>
            <li>Вкладка «По станции»: загрузка расписания для выбранной станции.</li>
            <li>Вкладка «Маршрут»: электрички между станциями отправления и прибытия/целиком проходищие через этот маршрут.</li>
            <li>Backend API: /api/search-station, /api/station-schedule, /api/train-route.</li>
          </ul>
        </section>
      </article>
    </Container>
  );
}