import { useAuth } from '../../hooks/useAuth';
import './Home.scss';
const Home = () => {
  const { user } = useAuth();
  return <div className="home"><h2>Здравствуйте, {user?.name}</h2><p>В разделе «Расписание» можно посмотреть отметки команды и указать свою доступность на своих квестах.</p></div>;
};
export default Home;
