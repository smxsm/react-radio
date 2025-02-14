import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import styles from './Privacy.module.css';

export default function Privacy() {
  const { t, i18n } = useTranslation();
  const translate = t as (key: string) => string;
  return (
    <>
    <article className={styles.article}>
      <header className={styles.header}>
        <h1 className={styles.statusCode}>{translate('info.privacy.headline')}</h1>
      </header>
        {i18n.language === 'en' && (
          <div>
            <h2>Privacy Policy for Radio Hero</h2>
            <br/>
            <h3>1. Introduction</h3>
              <p>We appreciate your interest in our radio app. Protecting your personal data is important to us. This privacy policy informs you about what data we collect, how we use it, and what rights you have.</p>
            <br/>
            <h3>2. Responsible Party</h3>
              <p>The party responsible for data processing within this app is:</p>
            <p>rent-a-hero<br />Stefan Moises<br />Mathildenstr. 39<br />90489 Nürnberg<br />Deutschland
              <br />info_AT_radio-hero.de</p>
            <br />
              <h3>3. What Data is Processed?</h3>
                <p>We process the following data:</p>
              <ul>
                <li><strong>Usage Data</strong>: Information about your use of the app (e.g., listened stations, played songs, timestamps of usage).</li>
                <li><strong>Optional Account Data</strong>: If you create an account, we store your email address and your favorite stations and songs.</li>
                <li><strong>Deletable Data</strong>: You can delete stored stations, songs, and your listening history at any time within the app.</li>
              </ul>
            <p>Your data is always securely transferred via SSL, your password is only stored encrypted with <a href='https://de.wikipedia.org/wiki/Bcrypt' target='_blank' rel='noreferrer'>bcrypt</a> 
              and therefore never visible to anybody and cannot be recovered from the stored hash.</p>
              <br/>
              <h3>4. Purpose of Data Processing</h3>
                <p>Your data is processed to:</p>
              <ul>
                <li>Provide worldwide internet radio streams.</li>
                <li>Save your favorites and listening history (if desired).</li>
                <li>Develop and optimize the app further.</li>
              </ul>
              <br/>
              <h3>5. Account and Data Deletion</h3>
            <p>You can request the deletion of your account at any time via <Link to="/auth/request-delete" className={styles.link}>the provided URL</Link>.
            All stored data will be permanently deleted within 24 hours. Within the app, you can manually remove your saved stations, songs, and listening history.</p>
              <br/>
              <h3>6. Data Sharing</h3>
                <p>We do not share your data with third parties unless required by law or necessary to provide the app.</p>
              <br/>
              <h3>7. Data Retention Period</h3>
                <p>Your data is stored only as long as necessary for the mentioned purposes or until you delete your account.</p>
              <br/>
              <h3>8. Your Rights</h3>
                <p>You have the right to:</p>
              <ul>
                <li>Request information about your stored data.</li>
                <li>Correct or delete your data.</li>
                <li>Restrict processing.</li>
                <li>Object to processing.</li>
              </ul>
              <p>To exercise these rights, please contact us at the above address.</p>
              <br/>
              <h3>9. Changes to the Privacy Policy</h3>
                <p>We reserve the right to update this privacy policy. Changes will be published within the app or on our website.</p>
              <br/>
              <h3>10. Contact</h3>
                <p>If you have any questions about data protection, you can contact us at any time:
                  <br/>info_AT_radio-hero.de</p>
                  <br/>
          </div>
        )}


        {i18n.language === 'de' && (
          <div>
            <h2>Datenschutzerklärung Radio Hero</h2>
            <br/>
            <h3>1. Einleitung</h3>
              <p>Wir freuen uns über Ihr Interesse an unserer Radio-App. Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. In dieser Datenschutzerklärung informieren wir Sie darüber, welche Daten wir erheben, wie wir sie verwenden und welche Rechte Sie haben.</p>
            <br/>
            <h3>2. Verantwortliche Stelle</h3>
              <p>Verantwortlich für die Datenverarbeitung im Rahmen dieser App ist:</p>
            <p>rent-a-hero<br/>Stefan Moises<br/>Mathildenstr. 39<br/>90489 Nürnberg<br/>Deutschland
            <br/>info_AT_radio-hero.de</p>
            <br/>
              <h3>3. Welche Daten werden verarbeitet?</h3>
                <p>Wir verarbeiten die folgenden Daten:</p>
                <div>
              <ul>
                <li><strong>Nutzungsdaten</strong>: Informationen über Ihre Nutzung der App (z. B. gehörte Sender, gespielte Songs, Zeitpunkte der Nutzung).</li>
                <li><strong>Optionale Kontodaten</strong>: Wenn Sie ein Konto anlegen, speichern wir Ihre E-Mail-Adresse und Ihre favorisierten Sender und Songs.</li>
                <li><strong>Löschbare Daten</strong>: Sie können gespeicherte Sender, Songs und Ihren Hörverlauf jederzeit in der App löschen.</li>
              </ul>
              <p>Ihre Daten werden jederzeit gesichert über SSL übertragen, Ihr Passwort wird mittels <a href='https://de.wikipedia.org/wiki/Bcrypt' target='_blank' rel='noreferrer'>bcrypt</a> verschlüsselt in der Datenbank gespeichert
              und ist somit weder einsehbar noch wiederherstellbar.</p>
              <br/>
            </div>
              <h3>4. Zwecke der Datenverarbeitung</h3>
                <p>Die Verarbeitung Ihrer Daten erfolgt, um:</p>
              <ul>
                <li>Ihnen weltweite Internetradio-Streams bereitzustellen.</li>
                <li>Ihre Favoriten und Ihren Hörverlauf zu speichern (falls gewünscht).</li>
                <li>Die App weiterzuentwickeln und zu optimieren.</li>
              </ul>
              <h3>5. Löschung des Kontos und gespeicherter Daten</h3>
            <p>Sie können die Löschung Ihres Kontos jederzeit über <Link to="/auth/request-delete" className={styles.link}>die bereitgestellte URL</Link> anfordern. 
            Alle gespeicherten Daten werden daraufhin innerhalb von 24 Stunden endgültig gelöscht. Innerhalb der App können Sie Ihre gespeicherten Sender, Songs und den Hörverlauf manuell entfernen.</p>
                <br/>
              <h3>6. Weitergabe von Daten</h3>
                <p>Wir geben Ihre Daten nicht an Dritte weiter, es sei denn, dies ist gesetzlich vorgeschrieben oder zur Bereitstellung der App erforderlich.</p>
                <br/>
              <h3>7. Speicherdauer</h3>
                <p>Ihre Daten werden nur so lange gespeichert, wie es für die genannten Zwecke erforderlich ist oder Sie Ihr Konto löschen.</p>
              <br/>
              <h3>8. Ihre Rechte</h3>
                <p>Sie haben das Recht auf:</p>
              <ul>
                <li>Auskunft über Ihre gespeicherten Daten.</li>
                <li>Berichtigung oder Löschung Ihrer Daten.</li>
                <li>Einschränkung der Verarbeitung.</li>
                <li>Widerspruch gegen die Verarbeitung.</li>
              </ul>
              <p>Kontaktieren Sie uns dazu unter der oben angegebenen Adresse.</p>
              <br/>
              <h3>9. Änderungen der Datenschutzerklärung</h3>
                <p>Wir behalten uns das Recht vor, diese Datenschutzerklärung zu aktualisieren. Änderungen werden in der App oder auf unserer Website veröffentlicht.</p>
              <br/>
              <h3>10. Kontakt</h3>
                <p>Falls Sie Fragen zum Datenschutz haben, können Sie uns jederzeit kontaktieren:
                <br/>info_AT_radio-hero.de</p>
                <br/>
          </div>
        )}
        
          </article>

        <Link to="/" className={styles.link}>
          {translate('errors.404.home')}
        </Link>
    </>
  );
}
