import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

// dacă vrei tipuri, derivă-le din componentă:
type EmojiPickerProps = React.ComponentProps<typeof Picker>;

export default function EmojiPicker(props: Partial<EmojiPickerProps>) {
    return <Picker data={data} {...props} />;
}
