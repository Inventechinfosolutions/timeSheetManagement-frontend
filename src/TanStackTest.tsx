import { useForm } from "@tanstack/react-form";

export default function TanStackTest() {
  const form = useForm({
    defaultValues: {
      name: "",
    },

    onSubmit: async ({ value }) => {
      console.log("Submitted:", value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        children={(field) => (
          <div>
            <label>Name</label>

            <input
              value={field.state.value}
              onChange={(e) =>
                field.handleChange(e.target.value)
              }
            />

            <button type="submit">
              Submit
            </button>
          </div>
        )}
      />
    </form>
  );
}