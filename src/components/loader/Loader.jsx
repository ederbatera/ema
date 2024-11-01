import { Spinner } from "@material-tailwind/react";

// eslint-disable-next-line react/prop-types
const Loader = ({props}) => {
    // console.log(props)
    return (
        //<Spinner color="blue" />
        //<Spinner color="red" />
        //<Spinner color="green" />
        <Spinner className={ (`
        text-blue-gray-900 
        dark:text-blue-gray-100 dark:hover:!bg-blue-gray-700 ${props}`)}
        />
        //<Spinner color="teal" />
        //<Spinner color="indigo" />
        //<Spinner color="purple" />
        //<Spinner color="pink" />
    )
}

export default Loader;