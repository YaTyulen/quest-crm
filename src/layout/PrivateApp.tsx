import AppRouter from "../router/AppRouter"


const PrivateApp = () => {
  return (
    <>
        {/** Сайдбар и тип того, а в содержательной части - роутер */}
        <AppRouter/>
        <div>PrivateApp</div>
    </>
    
  )
}

export default PrivateApp