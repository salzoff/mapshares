<template>
    <v-navigation-drawer permanent>
        <v-toolbar flat>
            <v-list>
                <v-list-tile>
                    <v-list-tile-action><v-icon>person_pin</v-icon></v-list-tile-action>
                    <v-list-tile-content>Center at user location</v-list-tile-content>
                </v-list-tile>
                <v-list-tile>
                    <v-list-tile-action><v-icon>add_location</v-icon></v-list-tile-action>
                    <v-list-tile-content>Add box</v-list-tile-content>
                </v-list-tile>
            </v-list>
        </v-toolbar>
    </v-navigation-drawer>
</template>

<script>
export default {
    name: 'map-controls'
};
</script>
