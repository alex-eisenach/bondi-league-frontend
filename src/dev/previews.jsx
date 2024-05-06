import {ComponentPreview, Previews} from '@react-buddy/ide-toolbox'
import {PaletteTree} from './palette'
import Topbar from "../scenes/global/topbar";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/Topbar">
                <Topbar/>
            </ComponentPreview>
        </Previews>
    )
}

export default ComponentPreviews