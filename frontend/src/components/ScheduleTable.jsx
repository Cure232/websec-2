export default function ScheduleTable({ data }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Время</th>
          <th>Поезд</th>
          <th>Направление</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, i) => (
          <tr key={i}>
            <td>{item.departure}</td>
            <td>{item.train}</td>
            <td>{item.direction}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}