import java.io.FileWriter;
import java.io.IOException;
import java.util.Scanner;

public class Main {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        String userInfo = getUserInfo(scanner);
        if (userInfo != null) {
            saveToFile("my_user.txt", userInfo);
        }

        scanner.close();
    }

    // Collects user input and returns it as a formatted string
    public static String getUserInfo(Scanner scanner) {
        System.out.print("Enter your first name: ");
        String firstName = scanner.nextLine().trim();

        System.out.print("Enter your surname: ");
        String surname = scanner.nextLine().trim();

        System.out.print("Enter your age: ");
        String ageInput = scanner.nextLine().trim();

        if (firstName.isEmpty() || surname.isEmpty() || ageInput.isEmpty()) {
            System.out.println("All fields are required.");
            return null;
        }

        int age;
        try {
            age = Integer.parseInt(ageInput);
        } catch (NumberFormatException e) {
            System.out.println("Invalid age. Please enter a number.");
            return null;
        }

        return "Name: " + firstName + "\nSurname: " + surname + "\nAge: " + age + "\n---\n";
    }

    // Saves text to a file
    public static void saveToFile(String filename, String text) {
        try (FileWriter writer = new FileWriter(filename, true)) {
            writer.write(text);
            System.out.println("User info saved to " + filename);
        } catch (IOException e) {
            System.out.println("Error writing to file: " + e.getMessage());
        }
    }
}
