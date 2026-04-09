export default function ScheduleCard({ train }) {
  return (
    <div className="card">
      <div className="train-title">
        {train.direction}
      </div>

      <div className="train-time">
        Отправление: {train.departure}
      </div>

      <div>
        Поезд: {train.train}
      </div>

      <div>
        Платформа: {train.platform}
      </div>
    </div>
  );
}